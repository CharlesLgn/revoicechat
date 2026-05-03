package fr.revoicechat.core.notification.service.profil;

import static fr.revoicechat.security.utils.RevoiceChatRoles.ROLE_ADMIN;

import java.util.UUID;

import fr.revoicechat.core.model.User;
import fr.revoicechat.core.notification.ProfilPictureUpdate;
import fr.revoicechat.core.repository.UserRepository;
import fr.revoicechat.core.service.user.UserRetriever;
import fr.revoicechat.notification.Notification;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;

@ApplicationScoped
public final class UserPictureUpdater implements PictureUpdater<User> {
  private final UserRetriever userRetriever;
  private final UserRepository userRepository;
  private final EntityManager entityManager;

  public UserPictureUpdater(UserRetriever userRetriever, EntityManager entityManager, UserRepository userRepository) {
    this.userRetriever = userRetriever;
    this.entityManager = entityManager;
    this.userRepository = userRepository;
  }

  @Override
  public User get(final UUID id) {
    return entityManager.find(User.class, id);
  }

  @Override
  public void emmit(final User user) {
    var currentUser = userRetriever.currentUser();
    if (currentUser.getId().equals(user.getId()) || currentUser.getRoles().contains(ROLE_ADMIN)) {
      Notification.of(new ProfilPictureUpdate(user.getId()))
                  .sendTo(userRepository.everyone());
    }
  }
}