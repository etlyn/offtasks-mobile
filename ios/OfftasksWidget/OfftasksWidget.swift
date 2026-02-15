import WidgetKit
import SwiftUI

struct WidgetTask: Decodable {
    let id: String
    let content: String
    let date: String
    let targetGroup: String
    let isComplete: Bool
}

struct WidgetSnapshot: Decodable {
    let generatedAt: String
    let today: [WidgetTask]
    let tomorrow: [WidgetTask]
    let upcoming: [WidgetTask]

    static let empty = WidgetSnapshot(generatedAt: "", today: [], tomorrow: [], upcoming: [])
}

struct OfftasksWidgetEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot
}

struct OfftasksWidgetProvider: TimelineProvider {
    private let appGroupId = "group.com.etlyn.offtasks"
    private let snapshotKey = "offtasks.widget.snapshot"

    func placeholder(in context: Context) -> OfftasksWidgetEntry {
        OfftasksWidgetEntry(date: Date(), snapshot: .empty)
    }

    func getSnapshot(in context: Context, completion: @escaping (OfftasksWidgetEntry) -> Void) {
        completion(OfftasksWidgetEntry(date: Date(), snapshot: loadSnapshot()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<OfftasksWidgetEntry>) -> Void) {
        let entry = OfftasksWidgetEntry(date: Date(), snapshot: loadSnapshot())
        let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date().addingTimeInterval(900)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private func loadSnapshot() -> WidgetSnapshot {
        guard
            let defaults = UserDefaults(suiteName: appGroupId),
            let raw = defaults.string(forKey: snapshotKey),
            let data = raw.data(using: .utf8)
        else {
            return .empty
        }

        do {
            return try JSONDecoder().decode(WidgetSnapshot.self, from: data)
        } catch {
            return .empty
        }
    }
}

struct OfftasksWidgetView: View {
    var entry: OfftasksWidgetProvider.Entry

    private var visibleTasks: [WidgetTask] {
        Array(entry.snapshot.today.prefix(5))
    }

    var body: some View {
            let content = VStack(alignment: .leading, spacing: 4) {
            Text("Today")
                .font(.caption)
                .fontWeight(.bold)
            if visibleTasks.isEmpty {
                Text("No tasks for today")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(visibleTasks, id: \.id) { task in
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 5, height: 5)
                        Text(task.content)
                            .font(.caption2)
                            .lineLimit(1)
                    }
                }
            }
        }
        .padding(.horizontal, 8)
        .padding(.top, 2)
        .padding(.bottom, 4)

        if #available(iOSApplicationExtension 17.0, *) {
            content.containerBackground(.background, for: .widget)
        } else {
            content
        }
    }
}

struct OfftasksWidget: Widget {
    let kind = "OfftasksWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: OfftasksWidgetProvider()) { entry in
            OfftasksWidgetView(entry: entry)
        }
        .configurationDisplayName("Offtasks")
        .description("See your next tasks at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
