import UIKit
import WebKit

class ViewController: UIViewController {
    
    private let webView = WKWebView(frame: .zero)
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        webView.translatesAutoresizingMaskIntoConstraints = false
        
        self.view.addSubview(self.webView)
        NSLayoutConstraint.activate([
            self.webView.leftAnchor.constraint(equalTo: self.view.leftAnchor),
            self.webView.bottomAnchor.constraint(equalTo: self.view.bottomAnchor),
            self.webView.rightAnchor.constraint(equalTo: self.view.rightAnchor),
            self.webView.topAnchor.constraint(equalTo: self.view.topAnchor),
        ])
        self.view.setNeedsLayout()
        if let url = URL(string: "") {
            let request = URLRequest(url: url)
            self.webView.load(request)
        }
    }
}

