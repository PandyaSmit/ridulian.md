import React from 'react';

interface TimelineEvent {
    year: string;
    description: string;
}

export default function Timeline({ events }: { events: TimelineEvent[] }) {
    if (!events || events.length === 0) return null;

    return (
        <div className="timeline-container">
            {events.map((event, idx) => (
                <div key={idx} className="timeline-event">
                    <div className="timeline-year">{event.year}</div>
                    <div className="timeline-content">{event.description}</div>
                </div>
            ))}
        </div>
    );
}
