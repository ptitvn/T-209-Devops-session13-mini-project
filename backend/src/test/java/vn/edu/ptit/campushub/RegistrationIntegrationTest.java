package vn.edu.ptit.campushub;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class RegistrationIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void anonymousCannotApplyRegistration() throws Exception {
        mockMvc.perform(post("/api/posts/1/registrations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"contactInfo":"0987654321","message":"Tham gia"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userCannotApplyToOwnPost() throws Exception {
        // Post 1 author is admin
        mockMvc.perform(post("/api/posts/1/registrations")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"contactInfo":"admin@ptit.edu.vn","message":"Tôi là admin"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Bạn là người đăng bài, không cần đăng ký tham gia"));
    }

    @Test
    void userCanCreatePostWithRegistrationAndAnotherUserCanApplyAndAuthorCanApprove() throws Exception {
        // 1. student creates a new post with allowRegistration = true
        MvcResult postResult = mockMvc.perform(post("/api/posts")
                        .with(httpBasic("student", "student123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Cần 2 bạn tham gia hackathon",
                                  "content": "Chủ đề IoT & DevOps, họp tại tầng 3",
                                  "categoryId": 6,
                                  "allowRegistration": true,
                                  "maxParticipants": 2
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.allowRegistration").value(true))
                .andExpect(jsonPath("$.maxParticipants").value(2))
                .andReturn();

        Number newPostIdNum = JsonPath.read(postResult.getResponse().getContentAsString(), "$.id");
        long newPostId = newPostIdNum.longValue();

        // 2. le_dong applies to this post
        MvcResult regResult = mockMvc.perform(post("/api/posts/" + newPostId + "/registrations")
                        .with(httpBasic("le_dong", "dong123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "contactInfo": "Zalo: 0912345678",
                                  "message": "Em có kiến thức về Spring và Docker, muốn tham gia!"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.user.username").value("le_dong"))
                .andReturn();

        Number regIdNum = JsonPath.read(regResult.getResponse().getContentAsString(), "$.id");
        long regId = regIdNum.longValue();

        // 3. student (author) checks applicants list
        mockMvc.perform(get("/api/posts/" + newPostId + "/registrations")
                        .with(httpBasic("student", "student123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$[0].user.username").value("le_dong"));

        // 4. student approves le_dong's registration
        mockMvc.perform(patch("/api/posts/" + newPostId + "/registrations/" + regId + "/status")
                        .with(httpBasic("student", "student123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status": "APPROVED"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // 5. le_dong checks his own registrations
        mockMvc.perform(get("/api/users/me/registrations")
                        .with(httpBasic("le_dong", "dong123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThanOrEqualTo(1)));

        // 6. le_dong cancels his registration
        mockMvc.perform(delete("/api/posts/" + newPostId + "/registrations/me")
                        .with(httpBasic("le_dong", "dong123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void postWithoutRegistrationRejectsApplications() throws Exception {
        // Post 3 does not allow registration (allowRegistration = false)
        mockMvc.perform(post("/api/posts/3/registrations")
                        .with(httpBasic("le_dong", "dong123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"contactInfo":"0912345678","message":"Xin tham gia"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Bài đăng này không mở đăng ký tham gia"));
    }
}
