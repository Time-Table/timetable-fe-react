export default function ({ width = 30, height = 30, color = "black", angle = "none" }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 31 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0.5" width="30" height="30" fill="url(#pattern0_1203_806)" />
      <defs>
        <pattern
          id="pattern0_1203_806"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use href="#image0_1203_806" transform="scale(0.01)" />{" "}
          {/* `xlink:href` 대신 `href` 사용 */}
        </pattern>
        <image
          id="image0_1203_806"
          width="100"
          height="100"
          href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAACP0lEQVR4nO3csU7bUBiGYcNQMcNNVOqIQM0AE5eE1LUjK0JiokvF0A0uhNHn+50BZWglWgYkFlYjo6gCRGltn8Qf9ftK3rBx9MQ6OSexi4KIiIiIiIgsk7Qh6ZOkU0mHKaXdoc9ptEn6KOk6Iupn21Fd16tDn9+okjSRdPsCxsMm6QsoJhigGGKAYogBiiEGKIYYoBhigGKIAcpyMc5a/v0J85QFf7SNiM2IuOFKGfbKePJOny+ntNn/KOf5/1epJ0ZXlJTSzjCveAQYXVCaVeLfO1LRBePb3wbk+Zhy9o/H+4pDv4+2V1VVvS9exzhpcbz9Px1rVKnfPONFlA4YP8uyXC/GnvJM+p6gtMVo/n8z1hRjTxln4JJ+pZQ+1HW9IukYDI/lkKtmoG+JMSnGntrPwH9khgOjz3LIbDZbk3SeGYMxQz2+di3L8l0OFDAyfgfeFwWMBfwgoSsKGAtam2qajynfGcANfqrDPKNjAsMngeGTwPBJYPgkMHwSGD4JDJ8Ehk8CwyeB4ZPA8Elg+ASGUWAYBYZRYBgFhlFgGAWGUWAYBYZRYBgFhlFgGAWGUWAYBYZRYBgFhlFgGAWGUWAYBYZRYBhVVdVW7nv6Oj47ZLK8V21cRHzmnr43CMINlkYgYBiBSLpkzPC6QsrX9uc+cCMQMIxAwDACAWPYQf0uIi4eb5KCSZ/BxJBHHL1hEJ43ZQQChhEIGEYgYBiBgGEEAkbGUkp7EXHQZ5tOp9s5z4mIiIiIiIiIiIiKpXcPpJVn9wdre2gAAAAASUVORK5CYII="
        />
      </defs>
    </svg>
  );
}
