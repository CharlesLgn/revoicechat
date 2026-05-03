package fr.revoicechat.core.representation;

import java.time.OffsetDateTime;
import java.util.UUID;

import fr.revoicechat.notification.model.ActiveStatus;
import fr.revoicechat.notification.model.NotificationPayload;
import fr.revoicechat.notification.model.NotificationType;
import fr.revoicechat.security.model.UserType;

@NotificationType(name = "USER_UPDATE")
public record UserRepresentation(
    UUID id,
    String displayName,
    String login,
    OffsetDateTime createdDate,
    ActiveStatus status,
    UserType type
) implements NotificationPayload {}
