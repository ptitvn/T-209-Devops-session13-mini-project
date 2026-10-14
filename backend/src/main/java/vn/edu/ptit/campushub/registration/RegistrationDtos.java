package vn.edu.ptit.campushub.registration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import vn.edu.ptit.campushub.post.PostDtos.AuthorView;

public final class RegistrationDtos {
    private RegistrationDtos() {
    }

    public record RegistrationRequest(
            @NotBlank(message = "Thông tin liên hệ không được để trống (SĐT/Zalo/Email)")
            @Size(max = 150, message = "Thông tin liên hệ tối đa 150 ký tự")
            String contactInfo,

            @Size(max = 500, message = "Lời nhắn tối đa 500 ký tự")
            String message
    ) {
    }

    public record RegistrationStatusUpdateRequest(
            @NotNull(message = "Trạng thái không được để trống")
            RegistrationStatus status
    ) {
    }

    public record RegistrationView(
            Long id,
            Long postId,
            String postTitle,
            AuthorView user,
            String contactInfo,
            String message,
            RegistrationStatus status,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static RegistrationView from(Registration reg) {
            return new RegistrationView(
                    reg.getId(),
                    reg.getPost().getId(),
                    reg.getPost().getTitle(),
                    new AuthorView(reg.getUser().getId(), reg.getUser().getUsername(), reg.getUser().getDisplayName()),
                    reg.getContactInfo(),
                    reg.getMessage(),
                    reg.getStatus(),
                    reg.getCreatedAt(),
                    reg.getUpdatedAt()
            );
        }
    }
}
