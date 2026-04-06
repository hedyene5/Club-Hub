package tn.esprit.virtual_event_management.service;

import tn.esprit.virtual_event_management.entity.RoleType;
import tn.esprit.virtual_event_management.entity.User;

import java.util.List;
import java.util.Optional;

public interface IUserService {
    User createUser(User user);
    User updateUser(String id, User user);
    void deleteUser(String id);
    Optional<User> getUserById(String id);
    List<User> getAllUsers();
    Optional<User> getUserByEmail(String email);
    List<User> getUsersByRole(RoleType role);
}
