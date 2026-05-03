package fr.revoicechat.core.service.user;

import java.util.UUID;

import fr.revoicechat.core.model.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class UserSettingsService {

  private final UserRetriever userRetriever;
  private final EntityManager entityManager;
  private final UserService userService;

  @Inject
  public UserSettingsService(final UserRetriever userRetriever, final EntityManager entityManager, final UserService userService) {
    this.userRetriever = userRetriever;
    this.entityManager = entityManager;
    this.userService = userService;
  }

  public String ofCurrentUser() {
    User user = userRetriever.currentUser();
    return user.getSettings();
  }

  public String ofUser(final UUID id) {
    return userService.getUser(id).getSettings();
  }

  @Transactional
  public String updateForCurrentUser(String settings) {
    User user = userRetriever.currentUser();
    user.setSettings(settings);
    entityManager.persist(user);
    return user.getSettings();
  }
}
