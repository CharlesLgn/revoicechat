package fr.revoicechat.core.service.user;

import static fr.revoicechat.core.nls.UserErrorCode.USER_NOT_FOUND;

import java.util.UUID;

import fr.revoicechat.core.model.User;
import fr.revoicechat.security.UserHolder;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
public class UserRetriever {

  private final UserHolder userHolder;
  private final EntityManager entityManager;

  public UserRetriever(UserHolder userHolder, EntityManager entityManager) {
    this.userHolder = userHolder;
    this.entityManager = entityManager;
  }

  public UUID currentUserId() {
    return currentUser().getId();
  }

  public User currentUser() {
    var user = entityManager.find(User.class, userHolder.getId());
    if (user == null) {
      throw new NotFoundException(USER_NOT_FOUND.translate());
    }
    return user;
  }

  public User currentUserOrNull() {
    try {
      return currentUser();
    } catch (Exception _) {
      return null;
    }
  }
}
