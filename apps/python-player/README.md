# MusicX Player (Python edition)

Кросс-платформенный музыкальный плеер на Python — работает на Windows, macOS и Linux.
Поддерживает mp3, wav, ogg, flac.

## Запуск

```bash
pip install -r requirements.txt
python3 player.py
```

На Linux также может понадобиться системный пакет `python3-tk` (на Windows и macOS
tkinter уже входит в стандартную установку Python):

```bash
sudo apt install python3-tk     # Debian/Ubuntu
sudo dnf install python3-tkinter  # Fedora
```

## Возможности

- Плейлист: добавление файлов, удаление выбранного трека
- Play / Pause / Stop / предыдущий / следующий трек
- Автопереход к следующему треку по окончании текущего
- Прогресс-бар и громкость
- Пробел — play/pause

## Сборка автономного .exe / .app (опционально)

Через [PyInstaller](https://pyinstaller.org/):

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --name MusicXPlayer player.py
```

Собранный исполняемый файл появится в папке `dist/`. Собирать нужно на целевой
платформе: `.exe` — на Windows, `.app` — на macOS.
