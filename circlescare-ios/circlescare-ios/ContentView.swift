//
//  ContentView.swift
//  circlescare-ios
//
//  Created by Pubudu Mihiranga on 2026-04-22.
//

import SwiftUI
import circlescareexpobrownfield

struct ContentView: View {
    init() {
        ReactNativeHostManager.shared.initialize()
    }
    
    var body: some View {
        ReactNativeView(moduleName: "main")
            .ignoresSafeArea()
    }
}

#Preview {
    ContentView()
}
