package fr.revoicechat.core.service.invitation;

import static fr.revoicechat.core.model.InvitationLinkStatus.*;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import fr.revoicechat.core.model.InvitationLink;
import fr.revoicechat.core.model.InvitationType;
import fr.revoicechat.core.model.User;
import fr.revoicechat.core.repository.InvitationLinkRepository;
import fr.revoicechat.core.service.server.ServerEntityService;
import fr.revoicechat.core.service.user.UserRetriever;
import fr.revoicechat.core.technicaldata.invitation.InvitationCategory;
import fr.revoicechat.web.error.ResourceNotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class InvitationLinkService implements InvitationLinkEntityRetriever, InvitationLinkUsage {

  private final UserRetriever userRetriever;
  private final EntityManager entityManager;
  private final ServerEntityService serverService;
  private final InvitationLinkRepository invitationLinkRepository;

  public InvitationLinkService(final UserRetriever userRetriever,
                               final EntityManager entityManager,
                               final ServerEntityService serverService,
                               final InvitationLinkRepository invitationLinkRepository) {
    this.userRetriever = userRetriever;
    this.entityManager = entityManager;
    this.serverService = serverService;
    this.invitationLinkRepository = invitationLinkRepository;
  }

  @Transactional
  public InvitationLink generateApplicationInvitation(final InvitationCategory invitationCategory) {
    User user = userRetriever.currentUser();
    var invitation = new InvitationLink();
    invitation.setId(UUID.randomUUID());
    invitation.setStatus(invitationCategory.getInitialStatus());
    invitation.setType(InvitationType.APPLICATION_JOIN);
    invitation.setSender(user);
    entityManager.persist(invitation);
    return invitation;
  }

  @Transactional
  public InvitationLink generateServerInvitation(final UUID serverId, final InvitationCategory invitationCategory) {
    var server = serverService.getEntity(serverId);
    User user = userRetriever.currentUser();
    var invitation = new InvitationLink();
    invitation.setId(UUID.randomUUID());
    invitation.setStatus(invitationCategory.getInitialStatus());
    invitation.setType(InvitationType.SERVER_JOIN);
    invitation.setTargetedServer(server);
    invitation.setSender(user);
    entityManager.persist(invitation);
    return invitation;
  }

  @Override
  public InvitationLink getEntity(final UUID invitationId) {
    return Optional.ofNullable(invitationId)
                   .map(id -> entityManager.find(InvitationLink.class, id))
                   .orElse(null);
  }

  public InvitationLink get(final UUID id) {
    var link = getEntity(id);
    if (link == null) {
      throw new ResourceNotFoundException(InvitationLink.class, id);
    }
    return link;
  }

  @Transactional
  public void revoke(final UUID id) {
    var link = entityManager.find(InvitationLink.class, id);
    if (link != null) {
      link.setStatus(REVOKED);
      entityManager.persist(link);
    }
  }

  public List<InvitationLink> getAllServerInvitations(final UUID id) {
    return invitationLinkRepository.getAllFromServer(id).toList();
  }

  public List<InvitationLink> getAllFromUser() {
    return invitationLinkRepository.getAllFromUser(userRetriever.currentUserId()).toList();
  }

  public List<InvitationLink> getAllApplicationInvitations() {
    return invitationLinkRepository.allApplicationInvitations().toList();
  }

  @Override
  @Transactional
  public void use(final InvitationLink invitationLink) {
    use(invitationLink, userRetriever.currentUser());
  }

  @Override
  @Transactional
  public void use(final InvitationLink invitationLink, final User user) {
    if (invitationLink != null && Objects.equals(invitationLink.getStatus(), CREATED)) {
      invitationLink.setStatus(USED);
      invitationLink.setApplier(user);
      entityManager.persist(invitationLink);
    }
  }
}
