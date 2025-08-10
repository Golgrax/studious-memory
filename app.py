from syqlorix import *

doc = Syqlorix()

# Add development proxy - this will map /api/pagasa-proxy to the actual feed
doc.proxy("/api/pagasa-proxy", "https://publicalert.pagasa.dost.gov.ph/feeds")

@doc.route('/')
def main_page(request):
    return Syqlorix(
        head(
                meta(charset="UTF-8"),
    meta(name="viewport", content="width=device-width, initial-scale=1.0"),
    meta(name="description", content="Real-time PAGASA weather alerts and flood advisories for the Philippines. Stay informed about typhoons, floods, and severe weather conditions."),
    meta(name="keywords", content="PAGASA, weather alerts, Philippines, typhoon, flood advisory, disaster preparedness"),
    meta(name="author", content="Bayanihan Weather Alert System"),
    Comment("Open Graph Meta Tags"),
    meta(property="og:title", content="Bayanihan Weather Alert Dashboard"),
    meta(property="og:description", content="Real-time PAGASA weather alerts and flood advisories for the Philippines"),
    meta(property="og:type", content="website"),
    meta(property="og:image", content="https://via.placeholder.com/1200x630/1e40af/ffffff?text=Bayanihan+Weather+Alert"),
    Comment("Twitter Card Meta Tags"),
    meta(name="twitter:card", content="summary_large_image"),
    meta(name="twitter:title", content="Bayanihan Weather Alert Dashboard"),
    meta(name="twitter:description", content="Real-time PAGASA weather alerts and flood advisories for the Philippines"),
    meta(name="twitter:image", content="https://via.placeholder.com/1200x630/1e40af/ffffff?text=Bayanihan+Weather+Alert"),
    title(
        "Bayanihan Weather Alert Dashboard | Real-time PAGASA Alerts"
    ),
    Comment("Favicon"),
    link(rel="icon", type="image/svg+xml", href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌦️</text></svg>"),
    Comment("Fonts"),
    link(rel="preconnect", href="https://fonts.googleapis.com"),
    link(rel="preconnect", href="https://fonts.gstatic.com", crossorigin=True),
    link(href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap", rel="stylesheet"),
    Comment("Icons"),
    link(rel="stylesheet", href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"),
    Comment("Styles"),
    link(rel="stylesheet", href="styles.css"),
    Comment("LeafletJS Map CSS"),
    link(rel="stylesheet", href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=", crossorigin=True),
    Comment("Progressive Web App Manifest"),
    link(rel="manifest", href="manifest.json"),
    meta(name="theme-color", content="#1e40af")
        ),
        body(
                Comment("Skip to Content Link for Accessibility"),
    a(
        "Skip to main content"
    , href="#main-content", class_="skip-link"),
    Comment("Loading Screen"),
    div(
        div(
            div(
                "🌦️"
            , class_="loading-logo"),
            h1(
                "Bayanihan Weather Alert"
            ),
            div(class_="loading-spinner"),
            p(
                "Loading weather alerts..."
            )
        , class_="loading-content")
    , id="loading-screen", class_="loading-screen"),
    Comment("Header Section"),
    header(
        div(
            div(
                div(
                    div(
                        "🌦️"
                    , class_="logo-img"),
                    div(
                        h1(
                            "Bayanihan Weather Alert"
                        , class_="site-title"),
                        p(
                            "Real-time PAGASA Dashboard"
                        , class_="site-subtitle")
                    , class_="logo-text")
                , class_="logo-section"),
                div(
                    div(
                        span(class_="status-dot", id="connection-status"),
                        span(
                            "Connecting..."
                        , class_="status-text", id="status-text")
                    , class_="status-indicator"),
                    div(
                        span(
                            "Last Update:"
                        , class_="update-label"),
                        time(
                            "--:--"
                        , id="last-update-time", datetime=True)
                    , class_="last-update")
                , class_="header-status"),
                div(
                    label(
                        input_(type="checkbox", id="dark-mode-toggle"),
                        span(class_="slider round")
                    , class_="theme-switch", for_="dark-mode-toggle")
                , class_="theme-switch-wrapper"),
                nav(
                    button(
                        span(class_="hamburger"),
                        span(
                            "Toggle navigation menu"
                        , class_="sr-only")
                    , class_="nav-toggle", aria_expanded="false", aria_controls="nav-menu", id="nav-toggle"),
                    ul(
                        li(
                            a(
                                "Dashboard"
                            , href="#dashboard", class_="nav-link active")
                        ),
                        li(
                            a(
                                "Active Alerts"
                            , href="#alerts", class_="nav-link")
                        ),
                        li(
                            a(
                                "Map View"
                            , href="#map", class_="nav-link")
                        ),
                        li(
                            a(
                                "Analytics"
                            , href="#analytics", class_="nav-link")
                        )
                    , class_="nav-menu", id="nav-menu")
                , class_="main-nav", role="navigation", aria_label="Main navigation")
            , class_="header-content")
        , class_="container")
    , class_="header", role="banner"),
    Comment("Main Content"),
    main(
        Comment("Alert Banner for Critical Alerts"),
        div(
            div(
                div(
                    div(
                        "⚠️"
                    , class_="banner-icon"),
                    div(
                        strong(
                            "Critical Weather Alert:"
                        ),
                        span(
                            "Severe weather conditions detected in your area."
                        , id="critical-message")
                    , class_="banner-text"),
                    button(
                        "×"
                    , class_="banner-close", aria_label="Close alert banner", id="banner-close")
                , class_="banner-content")
            , class_="container")
        , class_="alert-banner", id="critical-banner", role="alert", aria_live="assertive", style="display: none;"),
        Comment("Dashboard Section"),
        section(
            div(
                div(
                    h2(
                        "Weather Alert Dashboard"
                    , class_="section-title"),
                    p(
                        "Real-time monitoring of PAGASA weather alerts and flood advisories across the Philippines"
                    , class_="section-description")
                , class_="section-header"),
                Comment("Quick Stats"),
                div(
                    Comment("ADD THIS NEW CARD"),
                    div(
                        div(
                            i(class_="fas fa-bell")
                        , class_="stat-icon total"),
                        div(
                            div(
                                "0"
                            , class_="stat-number", id="total-count"),
                            div(
                                "Total Active Alerts"
                            , class_="stat-label")
                        , class_="stat-content")
                    , class_="stat-card"),
                    div(
                        div(
                            i(class_="fas fa-exclamation-triangle")
                        , class_="stat-icon severe"),
                        div(
                            div(
                                "0"
                            , class_="stat-number", id="severe-count"),
                            div(
                                "Severe Alerts"
                            , class_="stat-label")
                        , class_="stat-content")
                    , class_="stat-card"),
                    div(
                        div(
                            i(class_="fas fa-exclamation-circle")
                        , class_="stat-icon moderate"),
                        div(
                            div(
                                "0"
                            , class_="stat-number", id="moderate-count"),
                            div(
                                "Moderate Alerts"
                            , class_="stat-label")
                        , class_="stat-content")
                    , class_="stat-card"),
                    div(
                        div(
                            i(class_="fas fa-info-circle")
                        , class_="stat-icon minor"),
                        div(
                            div(
                                "0"
                            , class_="stat-number", id="minor-count"),
                            div(
                                "Minor Alerts"
                            , class_="stat-label")
                        , class_="stat-content")
                    , class_="stat-card"),
                    div(
                        div(
                            i(class_="fas fa-map-marked-alt")
                        , class_="stat-icon regions"),
                        div(
                            div(
                                "0"
                            , class_="stat-number", id="regions-count"),
                            div(
                                "Affected Regions"
                            , class_="stat-label")
                        , class_="stat-content")
                    , class_="stat-card")
                , class_="stats-grid"),
                Comment("Filter Controls"),
                div(
                    div(
                        label(
                            "Filter by Region:"
                        , for_="region-filter", class_="filter-label"),
                        select(
                            option(
                                "All Regions"
                            , value=True),
                            option(
                                "National Capital Region (NCR)"
                            , value="ncr"),
                            option(
                                "Cordillera Administrative Region (CAR)"
                            , value="car"),
                            option(
                                "Region 1 (Ilocos Region)"
                            , value="region1"),
                            option(
                                "Region 2 (Cagayan Valley)"
                            , value="region2"),
                            option(
                                "Region 3 (Central Luzon)"
                            , value="region3"),
                            option(
                                "Region 4-A (CALABARZON)"
                            , value="region4a"),
                            option(
                                "Region 4-B (MIMAROPA)"
                            , value="region4b"),
                            option(
                                "Region 5 (Bicol Region)"
                            , value="region5"),
                            option(
                                "Region 6 (Western Visayas)"
                            , value="region6"),
                            option(
                                "Region 7 (Central Visayas)"
                            , value="region7"),
                            option(
                                "Region 8 (Eastern Visayas)"
                            , value="region8"),
                            option(
                                "Region 9 (Zamboanga Peninsula)"
                            , value="region9"),
                            option(
                                "Region 10 (Northern Mindanao)"
                            , value="region10"),
                            option(
                                "Region 11 (Davao Region)"
                            , value="region11"),
                            option(
                                "Region 12 (SOCCSKSARGEN)"
                            , value="region12"),
                            option(
                                "Region 13 (Caraga)"
                            , value="region13"),
                            option(
                                "BARMM (Bangsamoro Autonomous Region in Muslim Mindanao)"
                            , value="barmm")
                        , id="region-filter", class_="filter-select")
                    , class_="filter-group"),
                    div(
                        label(
                            "Filter by Severity:"
                        , for_="severity-filter", class_="filter-label"),
                        select(
                            option(
                                "All Severities"
                            , value=True),
                            option(
                                "Extreme"
                            , value="extreme"),
                            option(
                                "Severe"
                            , value="severe"),
                            option(
                                "Moderate"
                            , value="moderate"),
                            option(
                                "Minor"
                            , value="minor")
                        , id="severity-filter", class_="filter-select")
                    , class_="filter-group"),
                    div(
                        label(
                            "Search Alerts:"
                        , for_="alert-search", class_="filter-label"),
                        input_(type="search", id="alert-search", class_="filter-input", placeholder="Search by location or alert type...")
                    , class_="filter-group"),
                    button(
                        i(class_="fas fa-undo"),
                        "Reset Filters"
                    , class_="filter-reset", id="reset-filters")
                , class_="filter-section")
            , class_="container")
        , id="dashboard", class_="dashboard-section"),
        Comment("Active Alerts Section"),
        section(
            div(
                div(
                    h2(
                        "Active Weather Alerts"
                    , class_="section-title"),
                    div(
                        button(
                            i(class_="fas fa-sync-alt refresh-icon"),
                            "Refresh"
                        , class_="refresh-btn", id="refresh-alerts", aria_label="Refresh alerts"),
                        div(
                            button(
                                i(class_="fas fa-th")
                            , class_="view-btn active", data_view="grid", aria_label="Grid view"),
                            button(
                                i(class_="fas fa-list")
                            , class_="view-btn", data_view="list", aria_label="List view")
                        , class_="view-toggle")
                    , class_="section-actions")
                , class_="section-header"),
                Comment("Loading State"),
                div(
                    div(class_="loading-spinner"),
                    p(
                        "Loading weather alerts..."
                    )
                , class_="loading-state", id="alerts-loading"),
                Comment("No Alerts State"),
                div(
                    div(
                        "☀️"
                    , class_="no-alerts-icon"),
                    h3(
                        "No Active Weather Alerts"
                    ),
                    p(
                        "There are currently no active weather alerts for the selected filters. Stay safe and check back regularly for updates."
                    )
                , class_="no-alerts-state", id="no-alerts", style="display: none;"),
                Comment("Alerts Grid"),
                div(
                    Comment("Alert cards will be dynamically inserted here")
                , class_="alerts-grid", id="alerts-container")
            , class_="container")
        , id="alerts", class_="alerts-section"),
        Comment("Map Section"),
        section(
            div(
                div(
                    h2(
                        "Interactive Weather Map"
                    , class_="section-title"),
                    p(
                        "Geographic visualization of active weather alerts across the Philippines"
                    , class_="section-description")
                , class_="section-header"),
                div(
                    div(
                        div(
                            div(class_="loading-spinner"),
                            p(
                                "Loading interactive map..."
                            )
                        , class_="map-loading")
                    , class_="map-placeholder", id="weather-map"),
                    div(
                        h3(
                            "Alert Severity Legend"
                        , class_="legend-title"),
                        div(
                            div(
                                span(class_="legend-color extreme"),
                                span(
                                    "Extreme"
                                , class_="legend-label")
                            , class_="legend-item"),
                            div(
                                span(class_="legend-color severe"),
                                span(
                                    "Severe"
                                , class_="legend-label")
                            , class_="legend-item"),
                            div(
                                span(class_="legend-color moderate"),
                                span(
                                    "Moderate"
                                , class_="legend-label")
                            , class_="legend-item"),
                            div(
                                span(class_="legend-color minor"),
                                span(
                                    "Minor"
                                , class_="legend-label")
                            , class_="legend-item")
                        , class_="legend-items")
                    , class_="map-legend")
                , class_="map-container")
            , class_="container")
        , id="map", class_="map-section"),
        Comment("Analytics Section"),
        section(
            div(
                div(
                    h2(
                        "Weather Analytics"
                    , class_="section-title"),
                    p(
                        "Statistical analysis and trends of weather alerts"
                    , class_="section-description")
                , class_="section-header"),
                div(
                    div(
                        h3(
                            "Alert Frequency by Region"
                        , class_="chart-title"),
                        div(
                            canvas(id="region-canvas", width="400", height="300")
                        , class_="chart-placeholder", id="region-chart")
                    , class_="chart-container"),
                    div(
                        h3(
                            "Severity Distribution"
                        , class_="chart-title"),
                        div(
                            canvas(id="severity-canvas", width="400", height="300")
                        , class_="chart-placeholder", id="severity-chart")
                    , class_="chart-container"),
                    div(
                        h3(
                            "Alert Timeline (24 Hours)"
                        , class_="chart-title"),
                        div(
                            canvas(id="timeline-canvas", width="400", height="300")
                        , class_="chart-placeholder", id="timeline-chart")
                    , class_="chart-container"),
                    div(
                        h3(
                            "Weather Pattern Analysis"
                        , class_="chart-title"),
                        div(
                            canvas(id="pattern-canvas", width="400", height="300")
                        , class_="chart-placeholder", id="pattern-chart")
                    , class_="chart-container")
                , class_="analytics-grid")
            , class_="container")
        , id="analytics", class_="analytics-section")
    , id="main-content", class_="main-content", role="main"),
    Comment("Alert Detail Modal"),
    div(
        div(class_="modal-overlay", id="modal-overlay"),
        div(
            div(
                h2(
                    "Alert Details"
                , class_="modal-title", id="modal-title"),
                button(
                    i(class_="fas fa-times")
                , class_="modal-close", id="modal-close", aria_label="Close modal")
            , class_="modal-header"),
            div(
                Comment("Alert details will be dynamically inserted here")
            , class_="modal-body", id="modal-body"),
            div(
                a(
                    i(class_="fas fa-external-link-alt"),
                    "View on PAGASA"
                , class_="btn btn-secondary", id="modal-pagasa-link", target="_blank"),
                button(
                    "Close"
                , class_="btn btn-primary", id="modal-close-btn")
            , class_="modal-footer")
        , class_="modal-content")
    , class_="modal", id="alert-modal", aria_hidden="true", role="dialog", aria_labelledby="modal-title"),
    Comment("Footer"),
    footer(
        div(
            div(
                div(
                    h3(
                        "Bayanihan Weather Alert"
                    ),
                    p(
                        "Real-time weather alerts and flood advisories from PAGASA to keep Filipino communities safe and informed."
                    ),
                    div(
                        a(
                            i(class_="fab fa-facebook")
                        , href="#", class_="social-link", aria_label="Facebook"),
                        a(
                            i(class_="fab fa-twitter")
                        , href="#", class_="social-link", aria_label="Twitter"),
                        a(
                            i(class_="fab fa-instagram")
                        , href="#", class_="social-link", aria_label="Instagram")
                    , class_="footer-social")
                , class_="footer-section"),
                div(
                    h4(
                        "Quick Links"
                    ),
                    ul(
                        li(
                            a(
                                "Dashboard"
                            , href="#dashboard")
                        ),
                        li(
                            a(
                                "Active Alerts"
                            , href="#alerts")
                        ),
                        li(
                            a(
                                "Map View"
                            , href="#map")
                        ),
                        li(
                            a(
                                "Analytics"
                            , href="#analytics")
                        )
                    , class_="footer-links")
                , class_="footer-section"),
                div(
                    h4(
                        "Resources"
                    ),
                    ul(
                        li(
                            a(
                                "PAGASA Official"
                            , href="https://www.pagasa.dost.gov.ph/", target="_blank")
                        ),
                        li(
                            a(
                                "NDRRMC"
                            , href="https://www.ndrrmc.gov.ph/", target="_blank")
                        ),
                        li(
                            a(
                                "Emergency Contacts"
                            , href="#", target="_blank")
                        ),
                        li(
                            a(
                                "Safety Tips"
                            , href="#", target="_blank")
                        )
                    , class_="footer-links")
                , class_="footer-section"),
                div(
                    h4(
                        "About"
                    ),
                    ul(
                        li(
                            a(
                                "About Us"
                            , href="#")
                        ),
                        li(
                            a(
                                "Privacy Policy"
                            , href="#")
                        ),
                        li(
                            a(
                                "Terms of Service"
                            , href="#")
                        ),
                        li(
                            a(
                                "Contact"
                            , href="#")
                        )
                    , class_="footer-links")
                , class_="footer-section")
            , class_="footer-content"),
            div(
                p(
                    "© 2025 Bayanihan Weather Alert. Data provided by PAGASA."
                ),
                p(
                    "Built with ❤️ for Filipino communities"
                )
            , class_="footer-bottom")
        , class_="container")
    , class_="footer", role="contentinfo"),
    Comment("LeafletJS Map Script"),
    Comment("Chart.js Library"),
    Comment("LeafletJS Map Script"),
    Comment("Your Application Scripts"),
    Comment("Back to Top Button"),
    button(
        i(class_="fas fa-arrow-up")
    , id="back-to-top", class_="btn btn-primary", title="Go to top"),
            script(src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"),
            script(src="https://cdn.jsdelivr.net/npm/chart.js"),
            script(src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"),
            script(src="script.js")
        )
    )

# Development proxy route for PAGASA data
@doc.route('/api/pagasa-proxy')
def pagasa_proxy(request):
    import urllib.request
    
    try:
        # Fetch the actual PAGASA feed
        url = "https://publicalert.pagasa.dost.gov.ph/feeds/"
        
        # Set up the request with proper headers
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        with urllib.request.urlopen(req) as response:
            xml_data = response.read().decode('utf-8')
        
        # Return the XML data with proper headers
        return xml_data, 200, {'Content-Type': 'application/atom+xml'}
        
    except Exception as e:
        print(f"Proxy error: {e}")
        return {"error": "Failed to fetch PAGASA data"}, 500

# To run this script, save it as app.py and execute:
# syqlorix run app.py