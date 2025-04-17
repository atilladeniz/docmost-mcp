import { useParams } from "react-router-dom";
import { usePageQuery } from "@/features/page/queries/page-query";
import { FullEditor } from "@/features/editor/full-editor";
import HistoryModal from "@/features/page-history/components/history-modal";
import { Helmet } from "react-helmet-async";
import PageHeader from "@/features/page/components/header/page-header.tsx";
import { extractPageSlugId } from "@/lib";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { useSpaceAbility } from "@/features/space/permissions/use-space-ability.ts";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "@/features/space/permissions/permissions.type.ts";
import { useTranslation } from "react-i18next";
import { Error404 } from "@/components/ui/error-404.tsx";

export default function Page() {
  const { t } = useTranslation();
  const { pageSlug } = useParams();
  const {
    data: page,
    isLoading,
    isError,
    error,
  } = usePageQuery({ pageId: extractPageSlugId(pageSlug) });
  const { data: space } = useGetSpaceBySlugQuery(page?.space?.slug);

  const spaceRules = space?.membership?.permissions;
  const spaceAbility = useSpaceAbility(spaceRules);

  if (isLoading) {
    return <></>;
  }

  if (isError || !page) {
    console.error("Error loading page:", error);
    return <Error404 />;
  }

  if (!space) {
    console.error("Space not found for page:", page);
    return <Error404 />;
  }

  return (
    <div>
      <Helmet>
        <title>{`${page?.icon || ""}  ${page?.title || t("untitled")}`}</title>
      </Helmet>

      <PageHeader
        readOnly={spaceAbility.cannot(
          SpaceCaslAction.Manage,
          SpaceCaslSubject.Page
        )}
      />

      <FullEditor
        key={page.id}
        pageId={page.id}
        title={page.title}
        content={page.content}
        slugId={page.slugId}
        spaceSlug={page?.space?.slug}
        editable={spaceAbility.can(
          SpaceCaslAction.Manage,
          SpaceCaslSubject.Page
        )}
      />
      <HistoryModal pageId={page.id} />
    </div>
  );
}
