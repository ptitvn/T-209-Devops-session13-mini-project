package vn.edu.ptit.campushub.post;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {
    @Query("""
            select p from Post p
            where p.status <> vn.edu.ptit.campushub.post.PostStatus.HIDDEN
              and (:categoryId is null or p.category.id = :categoryId)
              and (:keyword = '' or lower(p.title) like lower(concat('%', :keyword, '%'))
                   or lower(p.content) like lower(concat('%', :keyword, '%')))
              and (:allowRegistration is null or p.allowRegistration = :allowRegistration)
              and (:authorId is null or p.author.id = :authorId)
            """)
    Page<Post> searchPublished(@Param("keyword") String keyword,
                               @Param("categoryId") Long categoryId,
                               @Param("allowRegistration") Boolean allowRegistration,
                               @Param("authorId") Long authorId,
                               Pageable pageable);

    default Page<Post> searchPublished(String keyword, Long categoryId, Pageable pageable) {
        return searchPublished(keyword, categoryId, null, null, pageable);
    }
}
