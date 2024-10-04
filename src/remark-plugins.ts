import { findAndReplace } from "mdast-util-find-and-replace";
import { toc } from "mdast-util-toc";
import { visit } from "unist-util-visit";
import { h } from "hastscript";
import type { Root } from "mdast";

interface ParagraphNode {
  type: "paragraph";
  url: string;
  children: [
    {
      type: "link";
      url: string;
      children: [
        {
          type: "text";
          value: string;
        },
      ];
    },
  ];
}

interface ListItemNode {
  type: "listItem";
  children: [
    ParagraphNode,
    (
      | {
          type: "list";
          children: Array<ListItemNode>;
        }
      | undefined
    ),
  ];
}

interface TOCTree {
  title: string;
  url: string;
  children: Array<TOCTree>;
}

function mapNode(node: ListItemNode): TOCTree {
  return {
    title: node.children[0].children[0].children[0].value,
    url: node.children[0].children[0].url,
    children: (node.children[1]?.children ?? []).map(mapNode),
  };
}

export function remarkTOC() {
  return (tree: any) => {
    const map = toc(tree, { ordered: true, maxDepth: 3 }).map as any;
    map.data ??= {};
    map.data.hProperties ??= {};
    map.data.hProperties["data-toc"] = "";

    findAndReplace(tree, [
      [
        "[[toc]]",
        () => {
          return map;
        },
      ],
    ]);

    tree.children.unshift({
      type: "mdxjsEsm",
      value: "",
      data: {
        estree: {
          type: "Program",
          sourceType: "module",
          body: [
            {
              type: "ExportNamedDeclaration",
              source: null,
              specifiers: [],
              declaration: {
                type: "VariableDeclaration",
                kind: "const",
                declarations: [
                  {
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name: "$$SolidBase_TOC" },
                    init: {
                      type: "Literal",
                      value: JSON.stringify(mapNode(map.children[0])),
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });
  };
}

const customContainers = new Set([
  "info",
  "tip",
  "important",
  "warning",
  "danger",
  "details",
]);

export function remarkCustomContainers() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (
        node.type === "containerDirective" ||
        node.type === "leafDirective" ||
        node.type === "textDirective"
      ) {
        if (!customContainers.has(node.name)) return;
        const maybeLabel = node.children[0];
        const hasLabel = maybeLabel.data?.directiveLabel;

        let labelText = undefined;

        if (hasLabel) {
          const maybeLabelElement = maybeLabel.children[0];
          if (maybeLabelElement.type === "text") {
            labelText = maybeLabelElement.value;
            (node.children as any[]).shift();
          }
        }

        const data = node.data || (node.data = {});

        const attributes = node.attributes || {};
        attributes.type = node.name;
        attributes.title = labelText;

        data.hName = "$$CustomContainer";
        data.hProperties = h("$$CustomContainer", attributes).properties;
      }
    });
  };
}
