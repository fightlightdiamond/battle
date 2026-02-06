/**
 * Page Generator for Low-Code Builder V2
 * Generates React page component code from EntityDefinition
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import type { EntityDefinition } from "../types/entityDefinition";

/**
 * Converts entity name to lowercase for variable names
 */
function toLowerCamelCase(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * Generates ListPage component code
 * Uses AppLayout and includes create button
 * Requirements: 2.1, 2.4
 */
export function generateListPage(entity: EntityDefinition): string {
  if (!entity.name || entity.fields.length === 0) {
    return `// Empty entity - no list page generated`;
  }

  const entityName = entity.name;
  const entityLower = toLowerCamelCase(entityName);

  return `import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layouts";
import { ${entityName}List } from "../components/${entityName}List";
import { getAll${entityName}s, delete${entityName} } from "../services/${entityLower}Service";
import type { ${entityName} } from "../types/${entityLower}";

/**
 * ${entityName}ListPage
 * Displays list of ${entityLower}s with create button
 */
export function ${entityName}ListPage() {
  const [items, setItems] = useState<${entityName}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    setIsLoading(true);
    const data = getAll${entityName}s();
    setItems(data);
    setIsLoading(false);
  };

  const handleDelete = (id: string) => {
    delete${entityName}(id);
    loadItems();
  };

  return (
    <AppLayout
      variant="menu"
      width="default"
      title="${entityName}s"
      headerRight={
        <Button asChild>
          <Link to="/${entityLower}s/new">
            <Plus className="h-4 w-4 mr-2" />
            Add ${entityName}
          </Link>
        </Button>
      }
    >
      <${entityName}List
        items={items}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </AppLayout>
  );
}
`;
}

/**
 * Generates CreatePage component code
 * Uses AppLayout with form component and navigation back to list
 * Requirements: 2.2, 2.4
 */
export function generateCreatePage(entity: EntityDefinition): string {
  if (!entity.name || entity.fields.length === 0) {
    return `// Empty entity - no create page generated`;
  }

  const entityName = entity.name;
  const entityLower = toLowerCamelCase(entityName);

  return `import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layouts";
import { ${entityName}Form } from "../components/${entityName}Form";
import { create${entityName} } from "../services/${entityLower}Service";
import type { ${entityName} } from "../types/${entityLower}";

/**
 * ${entityName}CreatePage
 * Form to create a new ${entityLower}
 */
export function ${entityName}CreatePage() {
  const navigate = useNavigate();

  const handleSubmit = (data: Omit<${entityName}, "id">) => {
    create${entityName}(data);
    navigate("/${entityLower}s");
  };

  return (
    <AppLayout
      variant="menu"
      width="narrow"
      title="Create ${entityName}"
      backTo="/${entityLower}s"
      backLabel="Back to List"
    >
      <${entityName}Form onSubmit={handleSubmit} />
    </AppLayout>
  );
}
`;
}

/**
 * Generates EditPage component code
 * Uses AppLayout with form component, id param, and loading state handling
 * Requirements: 2.3, 2.4
 */
export function generateEditPage(entity: EntityDefinition): string {
  if (!entity.name || entity.fields.length === 0) {
    return `// Empty entity - no edit page generated`;
  }

  const entityName = entity.name;
  const entityLower = toLowerCamelCase(entityName);

  return `import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layouts";
import { ${entityName}Form } from "../components/${entityName}Form";
import { get${entityName}ById, update${entityName} } from "../services/${entityLower}Service";
import type { ${entityName} } from "../types/${entityLower}";

/**
 * ${entityName}EditPage
 * Form to edit an existing ${entityLower}
 */
export function ${entityName}EditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<${entityName} | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const data = get${entityName}ById(id);
      setItem(data);
      setIsLoading(false);
    }
  }, [id]);

  const handleSubmit = (data: Partial<${entityName}>) => {
    if (!id) return;
    update${entityName}(id, data);
    navigate("/${entityLower}s");
  };

  if (isLoading) {
    return (
      <AppLayout
        variant="menu"
        width="narrow"
        title="Edit ${entityName}"
        backTo="/${entityLower}s"
      >
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!item) {
    return (
      <AppLayout
        variant="menu"
        width="narrow"
        title="Edit ${entityName}"
        backTo="/${entityLower}s"
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">${entityName} Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The ${entityLower} you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate("/${entityLower}s")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to ${entityName}s
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      variant="menu"
      width="narrow"
      title="Edit ${entityName}"
      backTo="/${entityLower}s"
    >
      <${entityName}Form defaultValues={item} onSubmit={handleSubmit} />
    </AppLayout>
  );
}
`;
}
