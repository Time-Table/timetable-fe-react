/**
 * 교체된 글의 옛 slug → 새 slug (2026-09-13, 서비스와 무관한 8편을 약속 잡기 주제로 교체).
 * 운영은 public/_redirects 가 301을 주고, 라우터는 이 표로 같은 곳에 보낸다.
 * 옛 주소는 색인돼 있으므로 404로 두지 않는다.
 */
export const LEGACY_SLUGS = {
  "stop-procrastination-time-management": "club-meeting-date-scheduling",
  "burnout-prevention-rest-time": "team-dinner-date-scheduling",
  "evening-self-development-schedule": "study-group-time-scheduling",
  "miracle-morning-chronotype": "schedule-coordination-spreadsheet-vs-tool",
  "sleep-deprivation-and-creativity": "team-schedule-coordination-5-people",
  "why-schedule-exercise": "friends-gathering-scheduling-tips",
  "weekend-active-rest-planning": "family-gathering-date-scheduling",
  "business-email-time-saving": "meeting-scheduler-app-vs-web",
};
