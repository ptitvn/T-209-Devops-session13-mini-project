package vn.edu.ptit.campushub.registration;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByPostIdOrderByCreatedAtDesc(Long postId);

    List<Registration> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Registration> findByPostIdAndUserId(Long postId, Long userId);

    long countByPostIdAndStatus(Long postId, RegistrationStatus status);

    void deleteByPostId(Long postId);

    boolean existsByPostIdAndUserId(Long postId, Long userId);
}
