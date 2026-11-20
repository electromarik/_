#!/usr/bin/env python3
"""MusicX Player (Python edition) — a small cross-platform music player.

Runs on Windows, macOS and Linux. Requires only the standard library
(tkinter) plus the `pygame` package for audio playback.

    pip install pygame
    python3 player.py
"""

import os
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

import pygame

SUPPORTED_EXTENSIONS = (".mp3", ".wav", ".ogg", ".flac")
POLL_INTERVAL_MS = 250


class Track:
    def __init__(self, path):
        self.path = path
        self.title = os.path.splitext(os.path.basename(path))[0]
        self.length = self._probe_length()

    def _probe_length(self):
        try:
            sound = pygame.mixer.Sound(self.path)
            return sound.get_length()
        except Exception:
            return None


def format_time(seconds):
    if seconds is None or seconds < 0:
        return "--:--"
    minutes = int(seconds) // 60
    secs = int(seconds) % 60
    return f"{minutes}:{secs:02d}"


class MusicPlayerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("MusicX Player")
        self.root.geometry("480x520")
        self.root.minsize(420, 440)

        pygame.mixer.init()

        self.playlist = []
        self.current_index = None
        self.is_playing = False
        self.is_paused = False
        self.play_started_at_ms = 0
        self.pause_offset_ms = 0

        self._build_ui()
        self._poll()

        self.root.protocol("WM_DELETE_WINDOW", self._on_close)
        self.root.bind("<space>", lambda _e: self.toggle_play())

    # ---------- UI ----------

    def _build_ui(self):
        toolbar = ttk.Frame(self.root, padding=8)
        toolbar.pack(fill="x")

        ttk.Button(toolbar, text="＋ Добавить файлы", command=self.add_files).pack(side="left")
        ttk.Button(toolbar, text="✕ Убрать", command=self.remove_selected).pack(side="left", padx=(8, 0))

        list_frame = ttk.Frame(self.root, padding=(8, 0))
        list_frame.pack(fill="both", expand=True)

        self.listbox = tk.Listbox(list_frame, activestyle="none", selectmode="browse")
        self.listbox.pack(side="left", fill="both", expand=True)
        self.listbox.bind("<Double-Button-1>", self._on_double_click)

        scrollbar = ttk.Scrollbar(list_frame, orient="vertical", command=self.listbox.yview)
        scrollbar.pack(side="right", fill="y")
        self.listbox.config(yscrollcommand=scrollbar.set)

        now_playing = ttk.Frame(self.root, padding=8)
        now_playing.pack(fill="x")
        self.now_playing_label = ttk.Label(now_playing, text="Ничего не выбрано", font=("TkDefaultFont", 11, "bold"))
        self.now_playing_label.pack(anchor="w")

        progress_frame = ttk.Frame(self.root, padding=(8, 0))
        progress_frame.pack(fill="x")
        self.elapsed_label = ttk.Label(progress_frame, text="0:00", width=5)
        self.elapsed_label.pack(side="left")
        self.progress = ttk.Progressbar(progress_frame, orient="horizontal", mode="determinate", maximum=1000)
        self.progress.pack(side="left", fill="x", expand=True, padx=6)
        self.duration_label = ttk.Label(progress_frame, text="--:--", width=5)
        self.duration_label.pack(side="left")

        controls = ttk.Frame(self.root, padding=8)
        controls.pack(fill="x")
        ttk.Button(controls, text="⏮", width=4, command=self.prev_track).pack(side="left")
        self.play_button = ttk.Button(controls, text="▶", width=4, command=self.toggle_play)
        self.play_button.pack(side="left", padx=6)
        ttk.Button(controls, text="⏭", width=4, command=self.next_track).pack(side="left")
        ttk.Button(controls, text="⏹", width=4, command=self.stop).pack(side="left", padx=6)

        ttk.Label(controls, text="🔈").pack(side="left", padx=(20, 4))
        self.volume_var = tk.DoubleVar(value=0.8)
        volume_slider = ttk.Scale(
            controls, from_=0, to=1, orient="horizontal",
            variable=self.volume_var, command=self._on_volume_change,
        )
        volume_slider.pack(side="left", fill="x", expand=True)
        pygame.mixer.music.set_volume(self.volume_var.get())

    # ---------- Playlist management ----------

    def add_files(self):
        paths = filedialog.askopenfilenames(
            title="Выберите аудиофайлы",
            filetypes=[("Аудио", " ".join("*" + ext for ext in SUPPORTED_EXTENSIONS)), ("Все файлы", "*.*")],
        )
        for path in paths:
            track = Track(path)
            self.playlist.append(track)
            label = f"{track.title}  ({format_time(track.length)})"
            self.listbox.insert("end", label)

    def remove_selected(self):
        selection = self.listbox.curselection()
        if not selection:
            return
        index = selection[0]
        if self.current_index == index:
            self.stop()
        self.listbox.delete(index)
        del self.playlist[index]
        if self.current_index is not None and index < self.current_index:
            self.current_index -= 1

    def _on_double_click(self, _event):
        selection = self.listbox.curselection()
        if selection:
            self.play_index(selection[0])

    # ---------- Playback ----------

    def play_index(self, index):
        if not (0 <= index < len(self.playlist)):
            return
        track = self.playlist[index]
        try:
            pygame.mixer.music.load(track.path)
            pygame.mixer.music.play()
        except pygame.error as exc:
            messagebox.showerror("Не удалось воспроизвести файл", str(exc))
            return

        self.current_index = index
        self.is_playing = True
        self.is_paused = False
        self.pause_offset_ms = 0
        self.play_started_at_ms = pygame.time.get_ticks()
        self.play_button.config(text="⏸")
        self.now_playing_label.config(text=track.title)
        self.duration_label.config(text=format_time(track.length))

        self.listbox.selection_clear(0, "end")
        self.listbox.selection_set(index)
        self.listbox.see(index)

    def toggle_play(self):
        if self.current_index is None:
            if self.playlist:
                self.play_index(0)
            return

        if self.is_playing and not self.is_paused:
            pygame.mixer.music.pause()
            self.is_paused = True
            self.pause_offset_ms += pygame.time.get_ticks() - self.play_started_at_ms
            self.play_button.config(text="▶")
        elif self.is_paused:
            pygame.mixer.music.unpause()
            self.is_paused = False
            self.play_started_at_ms = pygame.time.get_ticks()
            self.play_button.config(text="⏸")
        else:
            self.play_index(self.current_index)

    def stop(self):
        pygame.mixer.music.stop()
        self.is_playing = False
        self.is_paused = False
        self.play_button.config(text="▶")
        self.progress["value"] = 0
        self.elapsed_label.config(text="0:00")

    def next_track(self):
        if not self.playlist:
            return
        index = self.current_index if self.current_index is not None else -1
        self.play_index((index + 1) % len(self.playlist))

    def prev_track(self):
        if not self.playlist:
            return
        index = self.current_index if self.current_index is not None else 1
        self.play_index((index - 1) % len(self.playlist))

    def _on_volume_change(self, value):
        pygame.mixer.music.set_volume(float(value))

    # ---------- Polling / timer ----------

    def _poll(self):
        if self.is_playing and not self.is_paused:
            if not pygame.mixer.music.get_busy():
                self.next_track()
            else:
                elapsed_ms = self.pause_offset_ms + (pygame.time.get_ticks() - self.play_started_at_ms)
                elapsed = elapsed_ms / 1000.0
                self.elapsed_label.config(text=format_time(elapsed))
                track = self.playlist[self.current_index]
                if track.length:
                    self.progress["value"] = min(1000, (elapsed / track.length) * 1000)
        self.root.after(POLL_INTERVAL_MS, self._poll)

    def _on_close(self):
        pygame.mixer.music.stop()
        pygame.mixer.quit()
        self.root.destroy()


def main():
    root = tk.Tk()
    MusicPlayerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
