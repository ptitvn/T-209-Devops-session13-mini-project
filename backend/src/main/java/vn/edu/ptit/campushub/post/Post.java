package vn.edu.ptit.campushub.post;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import vn.edu.ptit.campushub.category.Category;
import vn.edu.ptit.campushub.user.User;

@Entity
@Table(name = "posts")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostStatus status = PostStatus.PUBLISHED;

    @Column(nullable = false)
    private boolean allowRegistration = false;

    @Column
    private Integer maxParticipants;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    protected Post() {
    }

    public Post(String title, String content, Category category, User author) {
        this(title, content, null, false, null, category, author);
    }

    public Post(String title, String content, String imageUrl, boolean allowRegistration,
                Integer maxParticipants, Category category, User author) {
        this.title = title;
        this.content = content;
        this.imageUrl = imageUrl;
        this.allowRegistration = allowRegistration;
        this.maxParticipants = maxParticipants;
        this.category = category;
        this.author = author;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void update(String title, String content, String imageUrl, boolean allowRegistration,
                       Integer maxParticipants, Category category) {
        this.title = title;
        this.content = content;
        this.imageUrl = imageUrl;
        this.allowRegistration = allowRegistration;
        this.maxParticipants = maxParticipants;
        this.category = category;
        this.updatedAt = Instant.now();
    }

    public void changeStatus(PostStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getImageUrl() { return imageUrl; }
    public PostStatus getStatus() { return status; }
    public boolean isAllowRegistration() { return allowRegistration; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public Category getCategory() { return category; }
    public User getAuthor() { return author; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
