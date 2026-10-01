package com.hospital.bedtracker.config;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.bedtracker.entity.AuthToken;
import com.hospital.bedtracker.entity.User;
import com.hospital.bedtracker.repository.AuthTokenRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
public class AuthTokenFilter extends OncePerRequestFilter {
    private final AuthTokenRepository tokenRepository;
    private final ObjectMapper objectMapper;

    public AuthTokenFilter(AuthTokenRepository tokenRepository, ObjectMapper objectMapper) {
        this.tokenRepository = tokenRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if ("WEBSOCKET".equalsIgnoreCase(request.getHeader("Upgrade"))) {
            chain.doFilter(request, response);
            return;
        }
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            tokenRepository.findByToken(token).ifPresent(authToken -> {
                if (authToken.isExpired()) {
                    tokenRepository.delete(authToken);
                } else {
                    User user = authToken.getUser();
                    if (Boolean.TRUE.equals(user.getActive())) {
                        List<SimpleGrantedAuthority> authorities =
                                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()));
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(user, null, authorities);
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            });
        }
        chain.doFilter(request, response);
    }
}
