package fr.revoicechat.notification.service;

import static fr.revoicechat.notification.nls.UserErrorCode.USER_NOT_FOUND;

import fr.revoicechat.notification.NotificationRegistrableHolder;
import fr.revoicechat.notification.model.NotificationRegistrable;
import fr.revoicechat.notification.model.NotificationRegistrableUser;
import fr.revoicechat.security.UserHolder;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
public class NotificationRegistrableHolderImpl implements NotificationRegistrableHolder {

  private final UserHolder userHolder;
  private final EntityManager entityManager;

  public NotificationRegistrableHolderImpl(UserHolder userHolder, EntityManager entityManager) {
    this.userHolder = userHolder;
    this.entityManager = entityManager;
  }

  @Override
  public NotificationRegistrable get() {
    var user = entityManager.find(NotificationRegistrableUser.class, userHolder.getId());
    if (user == null) {
      throw new NotFoundException(USER_NOT_FOUND.translate());
    }
    return user;
  }
}
