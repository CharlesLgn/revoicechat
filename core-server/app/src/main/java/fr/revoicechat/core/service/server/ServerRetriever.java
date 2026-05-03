package fr.revoicechat.core.service.server;

import java.util.List;
import java.util.UUID;

import fr.revoicechat.core.model.Server;
import fr.revoicechat.core.repository.ServerRepository;
import fr.revoicechat.core.service.user.UserRetriever;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class ServerRetriever {

  private final UserRetriever userRetriever;
  private final ServerRepository serverRepository;
  private final ServerEntityRetriever serverEntityRetriever;

  public ServerRetriever(UserRetriever userRetriever, ServerRepository serverRepository, ServerEntityRetriever serverEntityRetriever) {
    this.userRetriever = userRetriever;
    this.serverRepository = serverRepository;
    this.serverEntityRetriever = serverEntityRetriever;
  }

  /** Retrieves a server from the database by its unique identifier. */
  public Server getEntity(final UUID id) {
    return serverEntityRetriever.getEntity(id);
  }

  /** @return all servers for the connected user. */
  @Transactional
  public List<Server> getAllMyServers() {
    return serverRepository.getByUser(userRetriever.currentUser()).toList();
  }

  /** @return all public servers. */
  @Transactional
  public List<Server> getAllPublicServers(final boolean joinedToo) {
    var servers = serverRepository.getPublicServer();
    if (joinedToo) {
      return servers.toList();
    } else {
      var serverIds = serverRepository.getByUser(userRetriever.currentUser()).map(Server::getId).toList();
      return servers.filter(server -> !serverIds.contains(server.getId())).toList();
    }
  }
}
