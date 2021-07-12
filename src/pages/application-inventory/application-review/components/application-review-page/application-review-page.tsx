import React from "react";
import { useTranslation } from "react-i18next";

import { PageSection, Text } from "@patternfly/react-core";

import { PageHeader } from "shared/components";

import { Paths } from "Paths";

export const ApplicationReviewPage: React.FC = ({ children }) => {
  const { t } = useTranslation();

  return (
    <>
      <PageSection variant="light">
        <PageHeader
          title={t("terms.review")}
          description={
            <Text component="p">{t("message.reviewInstructions")}</Text>
          }
          breadcrumbs={[
            {
              title: t("terms.applications"),
              path: Paths.applicationInventory_applicationList,
            },
            {
              title: t("terms.review"),
              path: Paths.applicationInventory_review,
            },
          ]}
          menuActions={[]}
        />
      </PageSection>
      <PageSection variant="light">{children}</PageSection>
    </>
  );
};
