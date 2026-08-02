package fr.revoicechat.core.service.message.textextractor;

import static fr.revoicechat.core.representation.message.PatternType.SERVER_INVITATION;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import jakarta.enterprise.context.ApplicationScoped;

import fr.revoicechat.core.model.InvitationLinkStatus;
import fr.revoicechat.core.model.Message;
import fr.revoicechat.core.representation.message.ServerInvitationPattern;
import fr.revoicechat.core.representation.message.ServerInvitationPattern.LightInvitationRepresentation;
import fr.revoicechat.core.representation.message.ServerInvitationPattern.LightServerRepresentation;
import fr.revoicechat.core.representation.message.TextPattern;
import fr.revoicechat.core.service.invitation.InvitationLinkEntityRetriever;
import io.quarkus.arc.Unremovable;

@Unremovable
@ApplicationScoped
public class ServerInvitationPatternExtractor implements TextPatternExtractor {

  private static final Pattern INVITATION_REGEXP = Pattern.compile("<@invitationId:(?<id>[0-9a-fA-F\\-]{36})>");

  private final InvitationLinkEntityRetriever invitationLinkService;

  public ServerInvitationPatternExtractor(final InvitationLinkEntityRetriever invitationLinkService) {
    this.invitationLinkService = invitationLinkService;
  }

  @Override
  public List<TextPattern> extract(final Message message) {
    List<TextPattern> mentions = new ArrayList<>();
    Matcher matcher = INVITATION_REGEXP.matcher(message.getText());
    while (matcher.find()) {
      toMention(matcher).ifPresent(mentions::add);
    }
    return mentions;
  }

  private Optional<TextPattern> toMention(Matcher matcher) {
    try {
      UUID id = UUID.fromString(matcher.group("id"));
      var invitation = invitationLinkService.getEntity(id);
      if (invitation == null) {
        return Optional.of(new TextPattern(
            matcher.group(),
            SERVER_INVITATION,
            new ServerInvitationPattern(new LightInvitationRepresentation(id, InvitationLinkStatus.DELETED), null)
        ));
      }
      if (invitation.getTargetedServer() == null) {
        return Optional.empty();
      }
      return Optional.of(new TextPattern(
          matcher.group(),
          SERVER_INVITATION,
          new ServerInvitationPattern(
              new LightInvitationRepresentation(id, invitation.getStatus()),
              new LightServerRepresentation(invitation.getTargetedServer().getId(), invitation.getTargetedServer().getName())
          )
      ));
    } catch (IllegalArgumentException _) {
      return Optional.empty();
    }
  }
}
