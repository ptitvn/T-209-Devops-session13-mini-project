package vn.edu.ptit.campushub.registration;

import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.ptit.campushub.common.ApiException;
import vn.edu.ptit.campushub.post.Post;
import vn.edu.ptit.campushub.post.PostRepository;
import vn.edu.ptit.campushub.post.PostStatus;
import vn.edu.ptit.campushub.registration.RegistrationDtos.RegistrationRequest;
import vn.edu.ptit.campushub.registration.RegistrationDtos.RegistrationView;
import vn.edu.ptit.campushub.user.Role;
import vn.edu.ptit.campushub.user.User;
import vn.edu.ptit.campushub.user.UserRepository;

@Service
@Transactional(readOnly = true)
public class RegistrationService {
    private final RegistrationRepository registrations;
    private final PostRepository posts;
    private final UserRepository users;

    public RegistrationService(RegistrationRepository registrations, PostRepository posts, UserRepository users) {
        this.registrations = registrations;
        this.posts = posts;
        this.users = users;
    }

    @Transactional
    public RegistrationView apply(Long postId, RegistrationRequest request, Principal principal) {
        User user = currentUser(principal);
        Post post = posts.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy bài đăng"));

        if (post.getStatus() == PostStatus.HIDDEN && user.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy bài đăng");
        }
        if (!post.isAllowRegistration()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bài đăng này không mở đăng ký tham gia");
        }
        if (post.getStatus() == PostStatus.RESOLVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Hoạt động này đã hoàn tất, không nhận thêm đăng ký");
        }
        if (post.getAuthor().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bạn là người đăng bài, không cần đăng ký tham gia");
        }

        if (post.getMaxParticipants() != null) {
            long approvedCount = registrations.countByPostIdAndStatus(post.getId(), RegistrationStatus.APPROVED);
            if (approvedCount >= post.getMaxParticipants()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Số lượng người tham gia đã đạt tối đa (" + post.getMaxParticipants() + ")");
            }
        }

        return registrations.findByPostIdAndUserId(postId, user.getId())
                .map(existing -> {
                    if (existing.getStatus() == RegistrationStatus.PENDING || existing.getStatus() == RegistrationStatus.APPROVED) {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "Bạn đã đăng ký bài đăng này rồi");
                    }
                    existing.updateStatus(RegistrationStatus.PENDING);
                    return RegistrationView.from(existing);
                })
                .orElseGet(() -> {
                    Registration newReg = new Registration(post, user, request.contactInfo().trim(),
                            request.message() != null ? request.message().trim() : null);
                    return RegistrationView.from(registrations.save(newReg));
                });
    }

    public List<RegistrationView> getRegistrationsByPost(Long postId, Principal principal) {
        User user = currentUser(principal);
        Post post = posts.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy bài đăng"));

        requireOwnerOrAdmin(post, user);

        return registrations.findByPostIdOrderByCreatedAtDesc(postId).stream()
                .map(RegistrationView::from)
                .toList();
    }

    @Transactional
    public RegistrationView updateStatus(Long postId, Long regId, RegistrationStatus newStatus, Principal principal) {
        User user = currentUser(principal);
        Post post = posts.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy bài đăng"));

        requireOwnerOrAdmin(post, user);

        Registration reg = registrations.findById(regId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đăng ký"));

        if (!reg.getPost().getId().equals(postId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Đăng ký không thuộc về bài đăng này");
        }

        if (newStatus == RegistrationStatus.APPROVED && post.getMaxParticipants() != null) {
            long approvedCount = registrations.countByPostIdAndStatus(post.getId(), RegistrationStatus.APPROVED);
            if (reg.getStatus() != RegistrationStatus.APPROVED && approvedCount >= post.getMaxParticipants()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Số lượng người tham gia đã đạt mức tối đa (" + post.getMaxParticipants() + ")");
            }
        }

        reg.updateStatus(newStatus);
        return RegistrationView.from(reg);
    }

    @Transactional
    public RegistrationView cancelMyRegistration(Long postId, Principal principal) {
        User user = currentUser(principal);
        Registration reg = registrations.findByPostIdAndUserId(postId, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bạn chưa đăng ký tham gia bài đăng này"));

        reg.updateStatus(RegistrationStatus.CANCELLED);
        return RegistrationView.from(reg);
    }

    public List<RegistrationView> getMyRegistrations(Principal principal) {
        User user = currentUser(principal);
        return registrations.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(RegistrationView::from)
                .toList();
    }

    private User currentUser(Principal principal) {
        if (principal == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập");
        }
        return users.findByUsername(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập"));
    }

    private void requireOwnerOrAdmin(Post post, User user) {
        if (!post.getAuthor().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền quản lý danh sách đăng ký của bài này");
        }
    }
}
