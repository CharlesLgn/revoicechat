package fr.revoicechat.core.service.serveruser;

import fr.revoicechat.core.model.Server;
import fr.revoicechat.core.model.ServerUser;
import fr.revoicechat.core.model.User;
import fr.revoicechat.core.service.user.UserRetriever;
import fr.revoicechat.risk.service.server.ServerRoleService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class ServerUserServiceImpl implements ServerUserService {

  private final EntityManager entityManager;
  private final ServerRoleService serverRoleService;
  private final UserRetriever userRetriever;

  public ServerUserServiceImpl(EntityManager entityManager,
                               ServerRoleService serverRoleService,
                               UserRetriever userRetriever) {
    this.entityManager = entityManager;
    this.serverRoleService = serverRoleService;
    this.userRetriever = userRetriever;
  }

  @Override
  @Transactional
  public ServerUser join(Server server) {
    User user = userRetriever.currentUser();
    ServerUser serverUser = new ServerUser();
    serverUser.setServer(server);
    serverUser.setUser(user);
    entityManager.persist(serverUser);
    if (server.getOwner() == null) {
      server.setOwner(user);
      entityManager.persist(server);
    }
    serverRoleService.addUserToDefaultServerRole(user.getId(), server.getId());
    return serverUser;
  }
}
