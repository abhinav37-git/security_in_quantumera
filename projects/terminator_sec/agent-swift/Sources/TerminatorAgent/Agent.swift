import Foundation

@main
struct TerminatorAgentSwift {
    static func main() async {
        print("Starting Terminator Sec Native macOS ML Agent...")
        let predictor = DGAPredictor()
        
        let domains = ["google.com", "xgz29faqa.xyz", "apple.com", "jhsd8923hjkjsdf.ru"]
        
        for domain in domains {
            do {
                print("Evaluating \(domain)...")
                let isDGA = try await predictor.predict(domain: domain)
                print(" -> Is DGA? \(isDGA)")
            } catch {
                print(" -> Error: \(error)")
            }
        }
    }
}