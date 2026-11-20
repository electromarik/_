// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "MusicXPlayer",
    platforms: [.macOS(.v12)],
    targets: [
        .executableTarget(name: "MusicXPlayer")
    ]
)
