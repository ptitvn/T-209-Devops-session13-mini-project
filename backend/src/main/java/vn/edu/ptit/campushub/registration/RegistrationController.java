package vn.edu.ptit.campushub.registration;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.ptit.campushub.registration.RegistrationDtos.RegistrationRequest;
import vn.edu.ptit.campushub.registration.RegistrationDtos.RegistrationStatusUpdateRequest;
import vn.edu.ptit.campushub.registration.RegistrationDtos.RegistrationView;

@RestController
@RequestMapping("/api")
public class RegistrationController {
    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/posts/{postId}/registrations")
    @ResponseStatus(HttpStatus.CREATED)
    public RegistrationView apply(
            @PathVariable Long postId,
            @Valid @RequestBody RegistrationRequest request,
            Principal principal) {
        return registrationService.apply(postId, request, principal);
    }

    @GetMapping("/posts/{postId}/registrations")
    public List<RegistrationView> getRegistrations(
            @PathVariable Long postId,
            Principal principal) {
        return registrationService.getRegistrationsByPost(postId, principal);
    }

    @PatchMapping("/posts/{postId}/registrations/{regId}/status")
    public RegistrationView updateStatus(
            @PathVariable Long postId,
            @PathVariable Long regId,
            @Valid @RequestBody RegistrationStatusUpdateRequest request,
            Principal principal) {
        return registrationService.updateStatus(postId, regId, request.status(), principal);
    }

    @DeleteMapping("/posts/{postId}/registrations/me")
    public RegistrationView cancelRegistration(
            @PathVariable Long postId,
            Principal principal) {
        return registrationService.cancelMyRegistration(postId, principal);
    }

    @GetMapping("/users/me/registrations")
    public List<RegistrationView> getMyRegistrations(Principal principal) {
        return registrationService.getMyRegistrations(principal);
    }
}
