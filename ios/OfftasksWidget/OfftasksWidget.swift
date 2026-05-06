import WidgetKit
import SwiftUI

struct WidgetTask: Decodable {
    let id: String
    let content: String
    let date: String?
    let targetGroup: String
    let isComplete: Bool
}

struct WidgetSnapshot: Decodable {
    let generatedAt: String
    let themeMode: String?
    let todayTotalCount: Int?
    let todayCompletedCount: Int?
    let today: [WidgetTask]
    let tomorrow: [WidgetTask]
    let upcoming: [WidgetTask]

    static let empty = WidgetSnapshot(
        generatedAt: "",
        themeMode: nil,
        todayTotalCount: nil,
        todayCompletedCount: nil,
        today: [],
        tomorrow: [],
        upcoming: []
    )
}

struct OfftasksWidgetEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot
    let themeMode: String
}

struct OfftasksWidgetProvider: TimelineProvider {
    private let appGroupId = "group.com.etlyn.offtasks"
    private let snapshotKey = "offtasks.widget.snapshot"
    private let themeModeKey = "offtasks.widget.theme-mode"

    func placeholder(in context: Context) -> OfftasksWidgetEntry {
        OfftasksWidgetEntry(date: Date(), snapshot: .empty, themeMode: "Light")
    }

    func getSnapshot(in context: Context, completion: @escaping (OfftasksWidgetEntry) -> Void) {
        let snapshot = loadSnapshot()
        completion(OfftasksWidgetEntry(date: Date(), snapshot: snapshot, themeMode: loadThemeMode(snapshot: snapshot)))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<OfftasksWidgetEntry>) -> Void) {
        let snapshot = loadSnapshot()
        let entry = OfftasksWidgetEntry(date: Date(), snapshot: snapshot, themeMode: loadThemeMode(snapshot: snapshot))
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

    private func loadThemeMode(snapshot: WidgetSnapshot) -> String {
        if let defaults = UserDefaults(suiteName: appGroupId),
           let storedThemeMode = defaults.string(forKey: themeModeKey),
           storedThemeMode == "Light" || storedThemeMode == "Dark" {
            return storedThemeMode
        }

        if let snapshotThemeMode = snapshot.themeMode,
           snapshotThemeMode == "Light" || snapshotThemeMode == "Dark" {
            return snapshotThemeMode
        }

        return "Light"
    }
}

struct OfftasksWidgetView: View {
    @Environment(\.widgetFamily) private var family
    var entry: OfftasksWidgetProvider.Entry

    private var isDarkMode: Bool {
        entry.themeMode == "Dark"
    }

    private var isSmallWidget: Bool {
        family == .systemSmall
    }

    private var headerFontSize: CGFloat {
        isSmallWidget ? 17 : 16
    }

    private var badgeFontSize: CGFloat {
        isSmallWidget ? 10 : 11
    }

    private var taskFontSize: CGFloat {
        isSmallWidget ? 12 : 11.5
    }

    private var checkboxSize: CGFloat {
        isSmallWidget ? 18 : 17
    }

    private var contentHorizontalPadding: CGFloat {
        isSmallWidget ? 18 : 16
    }

    private var contentVerticalPadding: CGFloat {
        isSmallWidget ? 20 : 14
    }

    private var contentSpacing: CGFloat {
        isSmallWidget ? 8 : 7
    }

    private var rowSpacing: CGFloat {
        isSmallWidget ? 7 : 6
    }

    private var widgetBackground: Color {
        if isDarkMode {
            Color(red: 17 / 255, green: 24 / 255, blue: 39 / 255)
        } else {
            Color.white
        }
    }

    private var primaryTextColor: Color {
        isDarkMode
            ? .white
            : Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255)
    }

    private var secondaryTextColor: Color {
        isDarkMode
            ? Color(red: 229 / 255, green: 231 / 255, blue: 235 / 255)
            : Color(red: 71 / 255, green: 85 / 255, blue: 105 / 255)
    }

    private var tertiaryTextColor: Color {
        isDarkMode
            ? Color(red: 148 / 255, green: 163 / 255, blue: 184 / 255)
            : Color(red: 148 / 255, green: 163 / 255, blue: 184 / 255)
    }

    private var completedTaskTextColor: Color {
        isDarkMode
            ? Color(red: 148 / 255, green: 163 / 255, blue: 184 / 255)
            : Color(red: 100 / 255, green: 116 / 255, blue: 139 / 255)
    }

    private var checkboxBorderColor: Color {
        isDarkMode
            ? Color.white.opacity(0.12)
            : Color(red: 203 / 255, green: 213 / 255, blue: 225 / 255)
    }

    private var emptyIconBackground: Color {
        isDarkMode
            ? Color.white.opacity(0.08)
            : Color(red: 226 / 255, green: 232 / 255, blue: 240 / 255).opacity(0.9)
    }

    private var pendingTodayTasks: [WidgetTask] {
        entry.snapshot.today.filter { !$0.isComplete }
    }

    private var visibleTasks: [WidgetTask] {
        Array(pendingTodayTasks.prefix(rowLimit))
    }

    private var rowLimit: Int {
        switch family {
        case .systemSmall:
            return 3
        default:
            return 5
        }
    }

    private var completedCount: Int {
        entry.snapshot.todayCompletedCount ?? entry.snapshot.today.filter(\.isComplete).count
    }

    private var totalCount: Int {
        entry.snapshot.todayTotalCount ?? entry.snapshot.today.count
    }

    private var emptyTitle: String {
        if totalCount > 0 && completedCount >= totalCount {
            return "All caught up"
        }

        return "No tasks for today"
    }

    private var emptyDescription: String {
        if totalCount > 0 && completedCount >= totalCount {
            return "Completed tasks are cleared from the widget automatically."
        }

        return "Add a task in the app and it will appear here on the next refresh."
    }

    var body: some View {
        let content = ZStack {
            widgetBackground

            VStack(alignment: .leading, spacing: contentSpacing) {
                header

                if visibleTasks.isEmpty {
                    emptyState
                } else {
                    VStack(alignment: .leading, spacing: rowSpacing) {
                        ForEach(visibleTasks, id: \.id) { task in
                            taskRow(task)
                        }
                    }
                }
            }
            .padding(.horizontal, contentHorizontalPadding)
            .padding(.vertical, contentVerticalPadding)
        }
        .clipShape(ContainerRelativeShape())

        if #available(iOSApplicationExtension 17.0, *) {
            content.containerBackground(for: .widget) {
                widgetBackground
            }
        } else {
            content
        }
    }

    private var header: some View {
        HStack(alignment: .center) {
            Text("Today")
                .font(.system(size: headerFontSize, weight: .medium, design: .rounded))
                .lineLimit(1)
                .foregroundStyle(primaryTextColor)

            Spacer(minLength: 12)

            Text(totalCount == 0 ? "0" : "\(completedCount)/\(totalCount)")
                .font(.system(size: badgeFontSize, weight: .semibold, design: .rounded))
                .foregroundStyle(.white)
                .padding(.horizontal, isSmallWidget ? 8 : 9)
                .padding(.vertical, isSmallWidget ? 5 : 6)
                .background(
                    Capsule(style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color(red: 20 / 255, green: 184 / 255, blue: 166 / 255).opacity(0.88),
                                    Color(red: 15 / 255, green: 118 / 255, blue: 110 / 255).opacity(0.92)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                )
                .overlay(
                    Capsule(style: .continuous)
                        .stroke(Color.white.opacity(0.28), lineWidth: 1)
                )
                .shadow(color: Color(red: 20 / 255, green: 184 / 255, blue: 166 / 255).opacity(0.24), radius: 10, x: 0, y: 4)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(emptyIconBackground)
                    .frame(width: 44, height: 44)

                Image(systemName: "tray")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundStyle(tertiaryTextColor)
            }

            Text(emptyTitle)
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(secondaryTextColor)

            Text(emptyDescription)
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(tertiaryTextColor)
                .multilineTextAlignment(.center)
                .lineLimit(3)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
    }

    private func taskRow(_ task: WidgetTask) -> some View {
        HStack(alignment: .center, spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(task.isComplete ? checkboxGradient : checkboxFill)
                    .overlay(
                        RoundedRectangle(cornerRadius: 6, style: .continuous)
                            .stroke(task.isComplete ? Color.white.opacity(0.32) : checkboxBorderColor, lineWidth: 1)
                    )
                    .frame(width: checkboxSize, height: checkboxSize)

                if task.isComplete {
                    Image(systemName: "checkmark")
                        .font(.system(size: isSmallWidget ? 9 : 10, weight: .bold))
                        .foregroundStyle(.white)
                }
            }

            Text(task.content)
                .font(.system(size: taskFontSize, weight: .regular, design: .rounded))
                .foregroundStyle(task.isComplete ? completedTaskTextColor : primaryTextColor)
                .lineLimit(1)
                .truncationMode(.tail)
                .minimumScaleFactor(0.92)
                .opacity(task.isComplete ? 0.68 : 1)
                .overlay(alignment: .center) {
                    if task.isComplete {
                        Rectangle()
                            .fill(completedTaskTextColor.opacity(0.85))
                            .frame(height: 1)
                    }
                }

            Spacer(minLength: 0)
        }
    }

    private var checkboxFill: LinearGradient {
        LinearGradient(
            colors: [
                isDarkMode
                    ? Color(red: 54 / 255, green: 65 / 255, blue: 83 / 255)
                    : Color(red: 241 / 255, green: 245 / 255, blue: 249 / 255),
                isDarkMode
                    ? Color(red: 54 / 255, green: 65 / 255, blue: 83 / 255)
                    : Color(red: 241 / 255, green: 245 / 255, blue: 249 / 255)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    private var checkboxGradient: LinearGradient {
        LinearGradient(
            colors: [
                Color(red: 20 / 255, green: 184 / 255, blue: 166 / 255).opacity(0.88),
                Color(red: 17 / 255, green: 94 / 255, blue: 89 / 255).opacity(0.92)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
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
        .contentMarginsDisabled()
    }
}
