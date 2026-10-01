package com.hospital.bedtracker.repository;
import com.hospital.bedtracker.entity.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {
    @Query("select t from AuthToken t join fetch t.user where t.token = :token")
    Optional<AuthToken> findByToken(@Param("token") String token);
    void deleteByUserId(Long userId);
}
