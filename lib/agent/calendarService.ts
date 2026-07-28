export interface CalendarEventInsertParams {
  summary: string;
  location: string;
  description: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  attendeeEmail: string;
}

export interface ReservedSlot {
  event_id: string;
  summary: string;
  formatted_time: string;
  start_iso: string;
  end_iso: string;
  status: 'confirmed';
}

export function getAvailableCalendarSlots(): { label: string; iso: string }[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const slots = [
    { hour: 9, minute: 0, label: 'Tomorrow at 9:00 AM' },
    { hour: 11, minute: 30, label: 'Tomorrow at 11:30 AM' },
    { hour: 14, minute: 0, label: 'Tomorrow at 2:00 PM' },
    { hour: 16, minute: 30, label: 'Tomorrow at 4:30 PM' },
  ];

  return slots.map((s) => {
    const slotDate = new Date(tomorrow);
    slotDate.setHours(s.hour, s.minute, 0, 0);
    return {
      label: `${s.label} (${slotDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})`,
      iso: slotDate.toISOString()
    };
  });
}

export function invokeCalendarEventsInsert(params: CalendarEventInsertParams): ReservedSlot {
  const eventId = `gcal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const startDate = new Date(params.startTime);
  const formattedTime = startDate.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return {
    event_id: eventId,
    summary: params.summary,
    formatted_time: formattedTime,
    start_iso: params.startTime,
    end_iso: params.endTime,
    status: 'confirmed'
  };
}
