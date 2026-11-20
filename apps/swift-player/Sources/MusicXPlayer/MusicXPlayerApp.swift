import SwiftUI

@main
struct MusicXPlayerApp: App {
    @StateObject private var player = PlayerViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(player)
                .frame(minWidth: 420, minHeight: 520)
        }
    }
}
