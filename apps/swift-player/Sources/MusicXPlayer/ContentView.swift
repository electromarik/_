import SwiftUI
import AppKit
import UniformTypeIdentifiers

struct ContentView: View {
    @EnvironmentObject var player: PlayerViewModel
    @State private var selectedIndex: Int?

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button("＋ Добавить файлы", action: addFiles)
                Button("✕ Убрать", action: removeSelected)
                    .disabled(selectedIndex == nil)
                Spacer()
            }
            .padding(8)

            List(selection: $selectedIndex) {
                ForEach(Array(player.playlist.enumerated()), id: \.element.id) { index, track in
                    HStack {
                        Text(track.title)
                        Spacer()
                        if index == player.currentIndex {
                            Image(systemName: player.isPlaying ? "speaker.wave.2.fill" : "pause.fill")
                                .foregroundColor(.accentColor)
                        }
                    }
                    .tag(index)
                    .contentShape(Rectangle())
                    .onTapGesture(count: 2) {
                        player.play(at: index)
                    }
                }
            }
            .listStyle(.inset)

            VStack(alignment: .leading, spacing: 4) {
                Text(player.currentTrack?.title ?? "Ничего не выбрано")
                    .font(.headline)
                HStack {
                    Text(formatTime(player.currentTime))
                        .font(.caption)
                        .monospacedDigit()
                    Slider(
                        value: Binding(
                            get: { player.currentTime },
                            set: { player.seek(to: $0) }
                        ),
                        in: 0...max(player.duration, 1)
                    )
                    Text(formatTime(player.duration))
                        .font(.caption)
                        .monospacedDigit()
                }
            }
            .padding(8)

            HStack(spacing: 16) {
                Button(action: player.previous) { Image(systemName: "backward.fill") }
                Button(action: player.togglePlayPause) {
                    Image(systemName: player.isPlaying ? "pause.fill" : "play.fill")
                        .font(.title2)
                }
                Button(action: player.next) { Image(systemName: "forward.fill") }
                Button(action: player.stop) { Image(systemName: "stop.fill") }

                Spacer()

                Image(systemName: "speaker.fill")
                Slider(value: $player.volume, in: 0...1)
                    .frame(width: 100)
            }
            .buttonStyle(.borderless)
            .padding(8)
        }
    }

    private func addFiles() {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = true
        panel.canChooseDirectories = false
        panel.allowedContentTypes = [.mp3, .wav, .audio]
        if panel.runModal() == .OK {
            player.addFiles(urls: panel.urls)
        }
    }

    private func removeSelected() {
        guard let index = selectedIndex else { return }
        player.removeTrack(at: index)
        selectedIndex = nil
    }

    private func formatTime(_ seconds: TimeInterval) -> String {
        guard seconds.isFinite, seconds >= 0 else { return "--:--" }
        let total = Int(seconds)
        return String(format: "%d:%02d", total / 60, total % 60)
    }
}
