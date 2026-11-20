import Foundation
import AVFoundation
import Combine

final class PlayerViewModel: NSObject, ObservableObject, AVAudioPlayerDelegate {
    @Published var playlist: [Track] = []
    @Published var currentIndex: Int?
    @Published var isPlaying: Bool = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    @Published var volume: Float = 0.8 {
        didSet { audioPlayer?.volume = volume }
    }

    private var audioPlayer: AVAudioPlayer?
    private var timer: Timer?

    var currentTrack: Track? {
        guard let index = currentIndex, playlist.indices.contains(index) else { return nil }
        return playlist[index]
    }

    func addFiles(urls: [URL]) {
        playlist.append(contentsOf: urls.map { Track(url: $0) })
    }

    func removeTrack(at index: Int) {
        guard playlist.indices.contains(index) else { return }
        if currentIndex == index {
            stop()
        }
        playlist.remove(at: index)
        if let current = currentIndex, index < current {
            currentIndex = current - 1
        }
    }

    func play(at index: Int) {
        guard playlist.indices.contains(index) else { return }
        do {
            let track = playlist[index]
            let player = try AVAudioPlayer(contentsOf: track.url)
            player.delegate = self
            player.volume = volume
            player.play()
            audioPlayer = player
            currentIndex = index
            isPlaying = true
            duration = player.duration
            currentTime = 0
            startTimer()
        } catch {
            print("MusicX: failed to play \(playlist[index].url): \(error)")
        }
    }

    func togglePlayPause() {
        guard let player = audioPlayer else {
            if !playlist.isEmpty { play(at: 0) }
            return
        }
        if player.isPlaying {
            player.pause()
            isPlaying = false
            stopTimer()
        } else {
            player.play()
            isPlaying = true
            startTimer()
        }
    }

    func stop() {
        audioPlayer?.stop()
        audioPlayer = nil
        isPlaying = false
        currentTime = 0
        stopTimer()
    }

    func next() {
        guard !playlist.isEmpty else { return }
        let nextIndex = ((currentIndex ?? -1) + 1) % playlist.count
        play(at: nextIndex)
    }

    func previous() {
        guard !playlist.isEmpty else { return }
        let count = playlist.count
        let prevIndex = (((currentIndex ?? 1) - 1) % count + count) % count
        play(at: prevIndex)
    }

    func seek(to time: TimeInterval) {
        audioPlayer?.currentTime = time
        currentTime = time
    }

    private func startTimer() {
        stopTimer()
        timer = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
            guard let self, let player = self.audioPlayer else { return }
            self.currentTime = player.currentTime
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        DispatchQueue.main.async { [weak self] in
            self?.next()
        }
    }
}
