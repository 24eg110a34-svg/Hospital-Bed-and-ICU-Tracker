package com.hospital.bedtracker.service;
import com.hospital.bedtracker.entity.AuthToken;
import com.hospital.bedtracker.entity.User;
import com.hospital.bedtracker.repository.AuthTokenRepository;
import com.hospital.bedtracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;

@Service
public class AuthService {
    private static final int TOKEN_HOURS = 12;

    @Autowired private UserRepository userRepository;
    @Autowired private AuthTokenRepository tokenRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuditService auditService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public Map<String, Object> login(String username, String rawPassword) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getActive())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        String token = generateToken();
        AuthToken authToken = new AuthToken();
        authToken.setToken(token);
        authToken.setUser(user);
        authToken.setExpiresAt(LocalDateTime.now().plusHours(TOKEN_HOURS));
        tokenRepository.save(authToken);
        auditService.log(user.getUsername(), user.getRole(), "LOGIN", "User", user.getId(), null, "AUTHENTICATED");
        Map<String, Object> userView = new java.util.HashMap<>();
        userView.put("id", user.getId());
        userView.put("username", user.getUsername());
        userView.put("fullName", user.getFullName() == null ? user.getUsername() : user.getFullName());
        userView.put("role", user.getRole());
        userView.put("hospitalId", user.getHospital() == null ? null : user.getHospital().getId());
        userView.put("hospitalName", user.getHospital() == null ? null : user.getHospital().getName());
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("token", token);
        response.put("expiresAt", authToken.getExpiresAt().toString());
        response.put("user", userView);
        return response;
    }

    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        String token = rawToken.startsWith("Bearer ") ? rawToken.substring(7) : rawToken;
        tokenRepository.findByToken(token).ifPresent(authToken -> {
            auditService.log(authToken.getUser().getUsername(), authToken.getUser().getRole(),
                    "LOGOUT", "User", authToken.getUser().getId(), null, "LOGGED_OUT");
            tokenRepository.delete(authToken);
        });
    }

    public User createUser(String username, String rawPassword, String role, String fullName) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setFullName(fullName);
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public boolean verifyRawPassword(String rawPassword, String encoded) {
        return passwordEncoder.matches(rawPassword, encoded);
    }

    private String generateToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
