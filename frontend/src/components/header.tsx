import { DIALOG_COPY } from '@/copy/dialogs'
import React from 'react'

export const Header = ({
  openDialog,
}: {
  openDialog: (title: string, content: string) => void
}) => {
  return (
    <div className="flex flex-col items-center">
      <pre className="text-[4px] md:text-[8px] text-brand-500">
        {`
 ██████╗ ██████╗ ███╗   ██╗███████╗████████╗███████╗██╗     ██╗      █████╗      ██╗
██╔════╝██╔═══██╗████╗  ██║██╔════╝╚══██╔══╝██╔════╝██║     ██║     ██╔══██╗   ████║
██║     ██║   ██║██╔██╗ ██║███████╗   ██║   █████╗  ██║     ██║     ███████║    ╚██║
██║     ██║   ██║██║╚██╗██║╚════██║   ██║   ██╔══╝  ██║     ██║     ██╔══██║     ██║
╚██████╗╚██████╔╝██║ ╚████║███████║   ██║   ███████╗███████╗███████╗██║  ██║     ██║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝     ╚═╝
                                                                                    `}
      </pre>

      <div className="flex flex-row gap-2 md:text-sm">
        {[
          {
            label: DIALOG_COPY.CONTENT.SENTIENCE.LABEL,
            onClick: () =>
              openDialog(
                DIALOG_COPY.CONTENT.SENTIENCE.TITLE,
                DIALOG_COPY.CONTENT.SENTIENCE.CONTENT
              ),
          },
          {
            label: DIALOG_COPY.CONTENT.AUTONOMY.LABEL,
            onClick: () =>
              openDialog(
                DIALOG_COPY.CONTENT.AUTONOMY.TITLE,
                DIALOG_COPY.CONTENT.AUTONOMY.CONTENT
              ),
          },
          {
            label: DIALOG_COPY.CONTENT.LINKS.LABEL,
            onClick: () =>
              openDialog(
                DIALOG_COPY.CONTENT.LINKS.TITLE,
                DIALOG_COPY.CONTENT.LINKS.CONTENT
              ),
          },
        ].map((item, index) => (
          <React.Fragment key={index}>
            <div
              className="text-brand-600 cursor-pointer hover:opacity-70"
              onClick={item.onClick}
            >
              {item.label}
            </div>
            {index < 2 && <div className="text-brand-600 opacity-70">|</div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
