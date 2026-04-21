package tn.esprit.virtual_event_management.controller;

import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.virtual_event_management.entity.DashboardStats;
import tn.esprit.virtual_event_management.entity.VirtualEvent;
import tn.esprit.virtual_event_management.service.DashboardService;
import tn.esprit.virtual_event_management.service.IVirtualEventService;

import java.util.List;
@AllArgsConstructor
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService dashboardService;
    private final IVirtualEventService eventService;


    // 📊 STATS
    @GetMapping("/stats")
    public DashboardStats getStats() {
        return dashboardService.getStats();
    }

    // 📅 EVENTS + PARTICIPANTS
    @GetMapping("/events")
    public List<VirtualEvent> getEvents() {
        return eventService.getAllEvents();
    }
}
