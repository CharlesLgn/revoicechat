package fr.revoicechat.notification.model;

import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "RVC_USER")
public class NotificationRegistrableUser implements NotificationRegistrable {

  @Id
  private UUID id;
  @Enumerated(EnumType.STRING)
  private ActiveStatus status = ActiveStatus.ONLINE;

  @Override
  public UUID getId() {
    return id;
  }

  public void setId(final UUID id) {
    this.id = id;
  }

  @Override
  public ActiveStatus getStatus() {
    return status;
  }

  public void setStatus(final ActiveStatus status) {
    this.status = status;
  }
}
