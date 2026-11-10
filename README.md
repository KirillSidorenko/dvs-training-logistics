# Логистика · учебный плагин

Плагин для тестового задания по поддержке AI-инструментов. Получает карточки отправлений, отслеживание, состав грузовых мест, тариф, маршрут и документы перевозчика. Готовит исходные поля отправления для переноса в учётную систему. Все операции локальные и выполняются на вымышленных данных.

## Установка

Понадобятся Codex Desktop, CLI Codex и Node.js версии 20 или новее. Откройте терминал и выполните:

```sh
codex plugin marketplace add KirillSidorenko/dvs-training-logistics
codex plugin add dvs-training-logistics@dvs-training-logistics
```

Если у вас уже установлена предыдущая версия, обновите каталог командой `codex plugin marketplace upgrade dvs-training-logistics` и повторите команду установки.

Откройте новый чат Codex. Если плагин не появился, перезапустите приложение. Для задания используйте только два учебных плагина и отправление `DEMO-1042`. [Второй плагин](https://github.com/KirillSidorenko/dvs-training-onec)

[Устройство плагина](docs/architecture/project-map.md)
