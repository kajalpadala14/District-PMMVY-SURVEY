# District Command Center

Agar Collector Sir, CEO Zila Panchayat, aur District Administration monitor karne wale hain, to dashboard sirf beneficiary list dikhane wala nahi hona chahiye. Iska purpose hona chahiye District Command & Monitoring Dashboard jahan Collector ek hi screen se dekh sake:

Kis Block ki performance sabse kharab hai.

Kis GP me survey pending hai.

Kaun survey officer kaam nahi kar raha.

Kis pending reason ki wajah se payment ruk raha hai.

Kitne cases resolve hue.

Kaunse villages attention demand kar rahe hain.

Isliye Lovable ke liye prompt bhi usi perspective se likhna chahiye.

🚀 LOVABLE PROMPT

Build a Collector Command & Monitoring Dashboard for Mahtari Vandan Yojana (District Administration)

Design and build a world-class District Collector Dashboard for monitoring Mahtari Vandan Yojana Pending Beneficiaries.

The application is intended for:

District Collector

CEO Zila Panchayat

District Program Officer

Block Officers

Survey Officers

The system should act as a District Command Center for monitoring all pending beneficiaries, survey progress, officer performance, and issue resolution across the district.

The UI should look like a premium Government Monitoring Platform similar to PM GatiShakti, Aspirational District Dashboard, NIC Governance Dashboard, and modern Power BI executive dashboards.

Primary Objective

There are 947 pending beneficiaries across the district.

The Collector should instantly know:

Which Block has maximum pending beneficiaries.

Which Gram Panchayat needs immediate intervention.

Why beneficiaries are pending.

Which officers are not completing surveys.

Which issues are increasing.

Which beneficiaries have already been resolved.

Overall district survey progress.

The dashboard should support complete drill-down navigation:

District
→ Block
→ Gram Panchayat
→ Village
→ Beneficiary
→ Survey Details

Everything should update in real time.

Technology

Frontend

HTML5

CSS3

Bootstrap 5

Vanilla JavaScript

Chart.js

Backend

Google Apps Script

Database

Google Sheets

Storage

Google Drive

No external database.

No Firebase.

No Supabase.

Entire project must run using Google Apps Script and Google Sheets only.

Government Dashboard UI

Design a premium government command center.

Theme

White

Blue

Green

Government style

Professional

Minimal

Dashboard should contain

Left Sidebar

Top Navigation

District Information Bar

KPI Cards

Charts

Maps (optional placeholder)

Filter Panel

Tables

Officer Monitoring Panel

Alerts Panel

Recent Activity Panel

Responsive for

Desktop

Laptop

Tablet

Mobile

Top KPI Cards

Display

Total Beneficiaries

Total Pending

Survey Completed

Survey Pending

Resolved Cases

Today's Surveys

Today's Resolved

Pending Percentage

Survey Progress %

Average Resolution Time

Pending Since 7 Days

Pending Since 30 Days

High Priority Cases

Cards should have

Icons

Trend Indicators

Percentage Change

Mini Charts

Hover Animations

Executive Dashboard

Collector should immediately see

District Progress

Block Ranking

Worst Performing Block

Best Performing Block

Worst GP

Highest Pending Village

Officer Performance

Issue Distribution

Pending Heatmap

Recent Survey Activities

Critical Alerts

Filters

District

Block

Gram Panchayat

Village

Survey Status

Pending Reason

Survey Officer

Date Range

Beneficiary Type

Search

Dashboard updates instantly.

Dashboard Charts

Create beautiful Chart.js visualizations.

1 Block Wise Pending

Horizontal Bar Chart

2 Gram Panchayat Wise Pending

Bar Chart

3 Pending Reason Distribution

Pie Chart

4 Survey Progress

Donut Chart

5 Daily Survey Trend

Line Chart

6 Daily Resolution Trend

Area Chart

7 Block Performance Ranking

Horizontal Bar

8 Officer Performance

Stacked Bar

9 Pending Age Analysis

30+

15+

7+

Today

10 Resolved vs Pending

Gauge Chart

Collector Alerts

Create automatic alerts.

Examples

Block crossing 100 pending

GP with no survey in last 7 days

Officer inactive for 5 days

Village with highest pending

Beneficiaries pending more than 30 days

Survey completion below target

Use

Red

Orange

Green indicators.

Officer Performance Dashboard

Show

Officer Name

Assigned Cases

Completed

Pending

Today's Survey

Average Completion Time

Last Activity

Performance Score

Completion %

Ranking

Collector should identify poor performers instantly.

Block Monitoring Table

Columns

Block

Total Beneficiaries

Pending

Completed

Resolved

Survey %

MCP Issues

Bank Issues

Aadhaar Issues

Aadhaar-Bank Link

Other Issues

Average Resolution Time

Officer Count

Performance Score

Status Indicator

Gram Panchayat Monitoring Table

Columns

GP

Village Count

Pending

Completed

Survey Pending

MCP

Bank

Aadhaar

Aadhaar-Bank Link

Other

Survey %

High Priority

Village Monitoring Table

Village

Beneficiaries

Pending

Completed

Survey %

Officer

Last Survey Date

Critical Cases

Status

Beneficiary Search

Search by

Name

Application ID

Mobile

Aadhaar

Village

GP

Block

Instant search.

Beneficiary Details

Open full profile.

Read Only

Application ID

Beneficiary ID

Name

Mobile

Aadhaar

Village

GP

Block

District

Pending Reason

Current Status

Survey History

Uploaded Documents

Officer History

Timeline

Survey Form

Professional Bootstrap Form.

Verification

MCP

Bank

Aadhaar

Aadhaar Bank Link

Other Issue

GPS Location (Optional)

Survey Date

Officer

Remarks

Beneficiary Photo

Supporting Documents

Submit

Save

Update

File Upload

Upload

Aadhaar

Passbook

Photo

Supporting Documents

Store in Google Drive.

Save Drive URL in Google Sheets.

Reports

Collector should download

District Report

Block Report

GP Report

Officer Report

Pending Report

Resolved Report

Survey Progress Report

Formats

Excel

CSV

PDF

Reports must respect filters.

Export Dashboard

Export current dashboard as

PDF

Excel

CSV

Print View

Activity Timeline

Recent Survey

Survey Updated

Case Resolved

Document Uploaded

Officer Assigned

Officer Updated

Notifications

Bootstrap Toast

Loading Spinner

Skeleton Loading

Success

Warning

Error

Pagination

Beneficiary Table

Officer Table

Village Table

GP Table

Server-side pagination.

Google Sheets

Sheet 1

Beneficiaries

Sheet 2

Survey Data

Sheet 3

Officer Master

Sheet 4

Block Master

Sheet 5

GP Master

Sheet 6

Dashboard Cache

Sheet 7

Audit Log

Google Apps Script APIs

Create REST APIs

Get Dashboard Summary

Get KPI

Get Beneficiary List

Search Beneficiary

Get Survey Details

Save Survey

Update Survey

Upload Documents

Get Reports

Export Report

Filter Dashboard

Officer Dashboard

Block Dashboard

GP Dashboard

Village Dashboard

Activity Log

Audit Log

Security

Role Based Access Control

District Collector

View entire district

CEO ZP

View district

District Officer

View district

Block Officer

View only own block

Survey Officer

View only assigned beneficiaries

No user should access data outside their assigned jurisdiction.

Performance

Dashboard should load within 3 seconds.

Charts should animate smoothly.

Filtering should not reload the page.

Use asynchronous JavaScript (AJAX) for all Google Apps Script API calls.

Final Goal

Build a production-ready District Collector Command & Control Dashboard that enables senior officials to monitor Mahtari Vandan Yojana implementation in real time, identify bottlenecks, evaluate officer performance, prioritize interventions, track pending beneficiaries from district to village level, and make data-driven administrative decisions using only HTML, CSS, JavaScript, Bootstrap 5, Chart.js, Google Apps Script, Google Drive, and Google Sheets, without requiring any external backend or database.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8d9e3018-6408-46e3-9673-8b5fc5041ba4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
