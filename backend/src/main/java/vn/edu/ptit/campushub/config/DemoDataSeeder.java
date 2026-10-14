package vn.edu.ptit.campushub.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.ptit.campushub.category.Category;
import vn.edu.ptit.campushub.category.CategoryRepository;
import vn.edu.ptit.campushub.post.Post;
import vn.edu.ptit.campushub.post.PostRepository;
import vn.edu.ptit.campushub.registration.Registration;
import vn.edu.ptit.campushub.registration.RegistrationRepository;
import vn.edu.ptit.campushub.user.Role;
import vn.edu.ptit.campushub.user.User;
import vn.edu.ptit.campushub.user.UserRepository;

@Component
public class DemoDataSeeder implements ApplicationRunner {
    private final UserRepository users;
    private final CategoryRepository categories;
    private final PostRepository posts;
    private final RegistrationRepository registrations;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(UserRepository users, CategoryRepository categories, PostRepository posts,
                          RegistrationRepository registrations, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.categories = categories;
        this.posts = posts;
        this.registrations = registrations;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Category events = createCategoryIfMissing("Sự kiện", "su-kien");
        Category lost = createCategoryIfMissing("Đồ thất lạc", "do-that-lac");
        createCategoryIfMissing("Hỏi đáp học tập", "hoi-dap");
        Category exchange = createCategoryIfMissing("Trao đổi đồ dùng", "trao-doi");
        createCategoryIfMissing("Phản ánh", "phan-anh");
        Category groups = createCategoryIfMissing("Tìm nhóm", "tim-nhom");

        User admin = createUserIfMissing("admin", "Quản trị viên", "admin123", Role.ADMIN);
        User student = createUserIfMissing("student", "Nguyễn Minh Anh", "student123", Role.USER);
        User dong = createUserIfMissing("le_dong", "Lê Trung Đông", "dong123", Role.USER);

        if (posts.count() == 0) {
            Post p1 = posts.save(new Post(
                    "Ngày hội Câu lạc bộ Sinh viên PTIT 2026",
                    "Các CLB công nghệ, văn nghệ và tình nguyện sẽ tổ chức gian hàng tuyển thành viên tại sân A2 vào chiều thứ Sáu tuần này. Đăng ký tham quan sớm để nhận quà lưu niệm từ ban tổ chức!",
                    "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=80",
                    true,
                    50,
                    events,
                    admin
            ));

            Post p2 = posts.save(new Post(
                    "Tìm đồng đội làm Mini Project môn DevOps - IT209",
                    "Nhóm mình hiện có 2 bạn, cần tìm thêm 1 bạn thành thạo Docker và CI/CD để hoàn thiện đồ án Session 13. Ưu tiên các bạn nhiệt tình và có thời gian họp nhóm vào cuối tuần.",
                    null,
                    true,
                    3,
                    groups,
                    student
            ));

            posts.save(new Post(
                    "Rơi ví màu đen gần Thư viện tầng 2",
                    "Mình đánh rơi một chiếc ví nam màu đen bên trong có thẻ sinh viên PTIT và thẻ ngân hàng. Bạn nào nhặt được vui lòng liên hệ giúp mình qua phần bình luận nhé, xin cảm ơn và hậu tạ!",
                    "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
                    false,
                    null,
                    lost,
                    student
            ));

            posts.save(new Post(
                    "Tặng lại bộ giáo trình Lập trình Mạng & Phân tích HTTT",
                    "Mình đã học xong hai môn này, muốn để lại cho các bạn khóa dưới cần tài liệu ôn thi. Sách còn mới 95%. Bạn nào cần thì đăng ký thông tin liên hệ nhé.",
                    null,
                    true,
                    2,
                    exchange,
                    dong
            ));

            // Seed sample registration
            if (registrations.count() == 0) {
                registrations.save(new Registration(p1, student, "Zalo: 0987654321 - minhanh@ptit.edu.vn",
                        "Em xin đăng ký 1 vé tham dự gian hàng CLB Tin học ạ."));
                registrations.save(new Registration(p2, dong, "Phone: 0912345678 - ledong@ptit.edu.vn",
                        "Mình đã có kinh nghiệm build Docker Compose và GitHub Actions, muốn tham gia nhóm!"));
            }
        }
    }

    private Category createCategoryIfMissing(String name, String slug) {
        return categories.findBySlug(slug)
                .orElseGet(() -> categories.save(new Category(name, slug)));
    }

    private User createUserIfMissing(String username, String displayName, String password, Role role) {
        return users.findByUsername(username)
                .orElseGet(() -> users.save(new User(username, displayName,
                        passwordEncoder.encode(password), role)));
    }
}
