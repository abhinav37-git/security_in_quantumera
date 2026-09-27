// Swift Package for Quantum Shield Proxy
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "QuantumProxy",
    platforms: [
        .macOS(.v15)
    ],
    products: [
        .library(name: "QuantumProxy", targets: ["QuantumProxy"])
    ],
    targets: [
        .target(
            name: "QuantumProxy",
            dependencies: [])
    ]
)