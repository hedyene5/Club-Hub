package tn.esprit.virtual_event_management.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.virtual_event_management.entity.User;

@Service
public class UserClientService {
    @Autowired
    private RestTemplate restTemplate;

    public User getUserById(Long id) {
        String url = "http://localhost:8080/users/" + id;
        return restTemplate.getForObject(url, User.class);
    }
}
