// Swift Package for Terminator Sec Native Agent
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "TerminatorAgent",
    platforms: [
        .macOS(.v15)
    ],
    products: [
        .executable(name: "terminator-agent-swift", targets: ["TerminatorAgent"])
    ],
    targets: [
        .executableTarget(
            name: "TerminatorAgent",
            dependencies: [])
    ]
)