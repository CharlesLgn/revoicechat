package fr.revoicechat.core.mapper;

import fr.revoicechat.core.model.User;
import fr.revoicechat.core.representation.UserRepresentation;
import fr.revoicechat.notification.Notification;
import fr.revoicechat.notification.model.ActiveStatus;
import fr.revoicechat.web.mapper.RepresentationMapper;
import io.quarkus.arc.Unremovable;
import jakarta.enterprise.context.ApplicationScoped;

@Unremovable
@ApplicationScoped
public class UserMapper implements RepresentationMapper<User, UserRepresentation> {
  @Override
  public UserRepresentation map(final User user) {
    return map(user, Notification.ping(user));
  }

  public UserRepresentation map(User user, ActiveStatus status) {
    return new UserRepresentation(
        user.getId(),
        user.getDisplayName(),
        user.getLogin(),
        user.getCreatedDate(),
        status,
        user.getType()
    );
  }
}
