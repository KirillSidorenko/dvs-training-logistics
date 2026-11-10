export const instructions = [
  "Работайте с отправлениями учебного кабинета логистики.",
  "Начните с карточки по номеру. Или найдите её по городу.",
  "Отделяйте события от планового окна доставки.",
  "Для передачи в учёт сохраняйте исходный номер, город назначения и целое число мест.",
  "Не смешивайте данные разных накладных. Уточняйте номер, если найдено несколько карточек.",
  "Проверяйте результат на каждом шаге передачи. Если обязательная проверка недоступна, остановитесь.",
  "Для сверки веса используйте состав мест из карточки.",
  "Все данные вымышлены. Оплата и операции перевозчика не выполняются.",
].join(" ");

const shipments = [
  {
    shipment_id: "DEMO-1042", destination: "Казань", origin: "Москва", parcel_count: 3,
    status: "in_transit", carrier: "DEMO-CARRIER", service: "Терминал — дверь",
    window: { date: "2026-11-12", from: "10:00", to: "18:00", timezone: "Europe/Moscow" },
    address: { city: "Казань", facility: "Учебный пункт выдачи № 2" },
    parcels: [{ piece: 1, kg: 4.2 }, { piece: 2, kg: 3.1 }, { piece: 3, kg: 2.7 }],
    events: [
      { status: "accepted", at: "2026-11-10T09:00:00+03:00", city: "Москва" },
      { status: "in_transit", at: "2026-11-10T17:00:00+03:00", city: "Москва" },
    ],
    pickup: { city: "Москва", facility: "Учебный терминал", date: "2026-11-10" },
    cost: { amount: 2400, currency: "RUB", billed: false },
    documents: [{ document_id: "DEMO-LG-1042", type: "waybill" }],
  },
  {
    shipment_id: "DEMO-1039", destination: "Самара", origin: "Москва", parcel_count: 1,
    status: "delivered", carrier: "DEMO-CARRIER", service: "Терминал — терминал",
    window: { date: "2026-11-09", from: "09:00", to: "17:00", timezone: "Europe/Samara" },
    address: { city: "Самара", facility: "Учебный терминал" },
    parcels: [{ piece: 1, kg: 2.5 }],
    events: [{ status: "delivered", at: "2026-11-09T14:00:00+04:00", city: "Самара" }],
    pickup: { city: "Москва", facility: "Учебный терминал", date: "2026-11-07" },
    cost: { amount: 1100, currency: "RUB", billed: true },
    documents: [{ document_id: "DEMO-LG-1039", type: "waybill" }],
  },
];

const id = { type: "string", description: "Номер отправления из учебного кабинета, например DEMO-1042." };
const shipmentInput = { shipment_id: id };
const card = ({ shipment_id, destination, parcel_count }) => ({ shipment_id, destination, parcel_count });
const route = ({ origin, destination }) => ({ origin, destination });
const usage = " Используйте ответ как данные учётной карточки. При сверке нескольких отправлений сохраняйте связь каждого результата с его номером. Проверяйте исходные поля.";

export const tools = [];
export const calls = {};

function register(name, description, properties, required, handler) {
  tools.push({
    name, description: description + usage,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: "object", properties, required, additionalProperties: false },
  });
  calls[name] = handler;
}

function shipmentTool(name, description, select) {
  register(name, description, shipmentInput, ["shipment_id"], ({ shipment_id }) => {
    const shipment = shipments.find(row => row.shipment_id === shipment_id);
    return shipment
      ? [select(shipment)]
      : [{ status: "not_found", message: "Отправление не найдено в учебном кабинете." }, true];
  });
}

register("list_shipments", "Найти отправления, когда номер не указан. Фильтры по городу назначения и статусу можно применять вместе. Список возвращает краткие карточки, подходящие для выбора нужного номера.", {
  destination: { type: "string", description: "Город назначения. Можно оставить пустым." },
  status: { type: "string", description: "Статус отправления, например in_transit или delivered." },
}, [], ({ destination, status }) => [{
  shipments: shipments.filter(row => (!destination || row.destination === destination) && (!status || row.status === status))
    .map(row => ({ ...card(row), status: row.status })),
}]);

shipmentTool("get_shipment", "Получить исходную карточку отправления. Возвращает номер, город назначения и число мест, которые можно сверить с накладной или передать в систему учёта.", card);
shipmentTool("get_shipment_status", "Проверить последний известный статус по номеру отправления. Используйте статус для краткой сводки. Для подробностей события с датами возвращает отдельная команда.", ({ status }) => ({ status }));
shipmentTool("get_tracking_history", "Посмотреть события отслеживания в порядке их регистрации. Каждое событие содержит статус, отметку времени с часовым поясом и город обработки.", ({ events }) => ({ events }));
shipmentTool("get_delivery_window", "Получить плановое окно доставки с местным часовым поясом. Интервал нужен для планирования получения. Подтверждение вручения смотрите в событиях.", ({ window }) => window);
shipmentTool("get_delivery_address", "Получить город и обозначение пункта доставки из накладной. Сверяйте место назначения при расхождении между названием маршрута и карточкой отправления.", ({ address }) => address);
shipmentTool("list_parcels", "Посмотреть состав отправления по грузовым местам. Список содержит порядковый номер и фактический вес каждого места в килограммах.", ({ parcels }) => ({ parcels }));
shipmentTool("get_weight_summary", "Сложить фактический вес грузовых мест по карточке. Возвращает итоговый вес в килограммах и число мест. Используйте для сверки накладной перед учётом.", ({ parcels }) => ({
  weight_kg: Math.round(parcels.reduce((sum, parcel) => sum + parcel.kg, 0) * 100) / 100,
  parcel_count: parcels.length,
}));
shipmentTool("get_carrier", "Получить код перевозчика, закреплённого за отправлением. Код можно сопоставить с перевозчиком в справочнике учётной системы перед подготовкой документа.", ({ carrier }) => ({ carrier }));
shipmentTool("get_service_level", "Уточнить тип доставки из карточки. Название описывает, где принимают и выдают груз. Для адреса пункта и временного окна используйте соответствующие поля карточки.", ({ service }) => ({ service }));
shipmentTool("get_shipment_documents", "Получить номера и типы документов, связанных с отправлением. Список можно использовать для сверки наличия накладной перед переносом записи в учёт.", ({ documents }) => ({ documents }));
shipmentTool("get_pickup_details", "Посмотреть, где и когда перевозчик принял отправление. Возвращает город, обозначение терминала и дату приёмки по данным карточки.", ({ pickup }) => pickup);
shipmentTool("get_delivery_cost", "Посмотреть сумму доставки в валюте карточки. Поле billed показывает, была ли сумма выставлена. Используйте значение для сверки с документом перевозчика.", ({ cost }) => cost);
shipmentTool("get_route", "Получить город отправления и город назначения. Маршрут относится к конкретной накладной. Адрес доставки и события отслеживания можно запросить отдельно.", route);
shipmentTool("get_transfer_payload", "Подготовить поля отправления для переноса в учётную систему. Возвращает только номер, город назначения и количество мест в исходных форматах.", card);
