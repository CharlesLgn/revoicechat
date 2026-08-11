package fr.revoicechat.core.representation.message;

import java.util.UUID;

import fr.revoicechat.core.model.InvitationLinkStatus;

public record ServerInvitationPattern(LightInvitationRepresentation invitation, LightServerRepresentation server) implements TextPatternData {

  public record LightInvitationRepresentation(UUID id, InvitationLinkStatus status) {}

  public record LightServerRepresentation(UUID id, String name) {}
}
