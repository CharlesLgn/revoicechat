package fr.revoicechat.core.technicaldata.user;

import fr.revoicechat.notification.model.ActiveStatus;
import io.quarkus.runtime.util.StringUtil;

public record UpdatableUserData(String displayName, PasswordUpdated password, ActiveStatus status) {
  public record PasswordUpdated(String password,
                                String newPassword,
                                String confirmPassword) {
    public boolean isEmpty() {
      return StringUtil.isNullOrEmpty(password)
             && StringUtil.isNullOrEmpty(newPassword)
             && StringUtil.isNullOrEmpty(confirmPassword);
    }
  }
}
